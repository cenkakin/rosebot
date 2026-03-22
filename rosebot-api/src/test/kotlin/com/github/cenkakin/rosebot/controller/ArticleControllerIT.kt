package com.github.cenkakin.rosebot.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.cenkakin.rosebot.dto.ArticleRequest
import com.github.cenkakin.rosebot.dto.ArticleResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest
@Testcontainers
class ArticleControllerIT {

    @Autowired
    private lateinit var context: WebApplicationContext

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build()
    }

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres:17").apply {
            withDatabaseName("rosebot")
            withUsername("rosebot")
            withPassword("rosebot")
        }

        @DynamicPropertySource
        @JvmStatic
        fun configureProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    private fun createArticle(articleTitle: String, articleContent: String): ArticleResponse {
        val requestBody = objectMapper.writeValueAsString(ArticleRequest(articleTitle, articleContent))
        val responseBody = mockMvc.post("/api/articles") {
            contentType = MediaType.APPLICATION_JSON
            content = requestBody
        }.andExpect {
            status { isCreated() }
        }.andReturn().response.contentAsString

        return objectMapper.readValue(responseBody, ArticleResponse::class.java)
    }

    @Test
    fun `POST creates article and GET returns it`() {
        val created = createArticle("Test Title", "Test Content")

        assertThat(created.title).isEqualTo("Test Title")
        assertThat(created.content).isEqualTo("Test Content")
        assertThat(created.id).isPositive()

        mockMvc.get("/api/articles/${created.id}").andExpect {
            status { isOk() }
            jsonPath("$.title") { value("Test Title") }
        }
    }

    @Test
    fun `GET all returns list of articles`() {
        createArticle("List Article", "List Content")

        mockMvc.get("/api/articles").andExpect {
            status { isOk() }
            jsonPath("$") { isArray() }
        }
    }

    @Test
    fun `PUT updates article`() {
        val created = createArticle("Original", "Original content")
        val updateBody = objectMapper.writeValueAsString(ArticleRequest("Updated", "Updated content"))

        mockMvc.put("/api/articles/${created.id}") {
            contentType = MediaType.APPLICATION_JSON
            content = updateBody
        }.andExpect {
            status { isOk() }
            jsonPath("$.title") { value("Updated") }
        }
    }

    @Test
    fun `DELETE removes article and subsequent GET returns 404`() {
        val created = createArticle("To Delete", "Delete me")

        mockMvc.delete("/api/articles/${created.id}").andExpect {
            status { isNoContent() }
        }

        mockMvc.get("/api/articles/${created.id}").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `GET non-existent article returns 404`() {
        mockMvc.get("/api/articles/999999").andExpect {
            status { isNotFound() }
        }
    }
}
