package com.github.cenkakin.rosebot.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.cenkakin.rosebot.auth.dto.AuthResponse
import com.github.cenkakin.rosebot.auth.dto.RegisterRequest
import com.github.cenkakin.rosebot.source.SourceType
import com.github.cenkakin.rosebot.source.dto.SourceRequest
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
class SourceControllerIT {
    @Autowired lateinit var context: WebApplicationContext

    @Autowired lateinit var objectMapper: ObjectMapper

    private lateinit var mockMvc: MockMvc
    private lateinit var token: String

    companion object {
        @Container @JvmStatic
        val postgres =
            PostgreSQLContainer<Nothing>("postgres:17").apply {
                withDatabaseName("rosebot")
                withUsername("rosebot")
                withPassword("rosebot")
            }

        @DynamicPropertySource @JvmStatic
        fun configureProperties(registry: DynamicPropertyRegistry) {
            // Use prop.* keys to match the ${prop.*} placeholders in application.yml
            registry.add("prop.spring.datasource.url", postgres::getJdbcUrl)
            registry.add("prop.spring.datasource.username", postgres::getUsername)
            registry.add("prop.spring.datasource.password", postgres::getPassword)
            registry.add("prop.app.jwt.secret") { "test-secret-key-must-be-at-least-32-chars!!" }
        }
    }

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build()
        token = registerAndLogin("test@example.com", "password123")
    }

    private fun registerAndLogin(
        email: String,
        password: String,
    ): String {
        val body = objectMapper.writeValueAsString(RegisterRequest(email, password))
        val response =
            mockMvc
                .post("/api/auth/register") {
                    contentType = MediaType.APPLICATION_JSON
                    content = body
                }.andReturn()
                .response.contentAsString
        return objectMapper.readValue(response, AuthResponse::class.java).token
    }

    @Test
    fun `POST creates source and GET returns it`() {
        val request =
            objectMapper.writeValueAsString(
                SourceRequest(SourceType.NEWS, "The Verge", "https://theverge.com/rss"),
            )
        mockMvc
            .post("/api/sources") {
                contentType = MediaType.APPLICATION_JSON
                content = request
                header("Authorization", "Bearer $token")
            }.andExpect { status { isCreated() } }

        mockMvc
            .get("/api/sources") {
                header("Authorization", "Bearer $token")
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].name") { value("The Verge") }
                jsonPath("$[0].type") { value("NEWS") }
            }
    }

    @Test
    fun `PUT updates source name and enabled flag`() {
        val createBody =
            objectMapper.writeValueAsString(
                SourceRequest(SourceType.REDDIT, "r/technology", "https://reddit.com/r/technology/.rss"),
            )
        val created =
            mockMvc
                .post("/api/sources") {
                    contentType = MediaType.APPLICATION_JSON
                    content = createBody
                    header("Authorization", "Bearer $token")
                }.andReturn()
                .response.contentAsString
        val id = objectMapper.readTree(created).get("id").asLong()

        val updateBody = """{"name":"r/tech","enabled":false}"""
        mockMvc
            .put("/api/sources/$id") {
                contentType = MediaType.APPLICATION_JSON
                content = updateBody
                header("Authorization", "Bearer $token")
            }.andExpect {
                status { isOk() }
                jsonPath("$.name") { value("r/tech") }
                jsonPath("$.enabled") { value(false) }
            }
    }

    @Test
    fun `DELETE removes source`() {
        val createBody =
            objectMapper.writeValueAsString(
                SourceRequest(SourceType.TWITTER, "@naval", "https://twitter.com/naval"),
            )
        val created =
            mockMvc
                .post("/api/sources") {
                    contentType = MediaType.APPLICATION_JSON
                    content = createBody
                    header("Authorization", "Bearer $token")
                }.andReturn()
                .response.contentAsString
        val id = objectMapper.readTree(created).get("id").asLong()

        mockMvc
            .delete("/api/sources/$id") {
                header("Authorization", "Bearer $token")
            }.andExpect { status { isNoContent() } }

        mockMvc
            .get("/api/sources") {
                header("Authorization", "Bearer $token")
            }.andExpect {
                status { isOk() }
                jsonPath("$") { isEmpty() }
            }
    }

    @Test
    fun `GET without token returns 403`() {
        mockMvc
            .get("/api/sources")
            .andExpect { status { isForbidden() } }
    }
}
