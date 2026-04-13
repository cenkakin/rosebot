package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.cluster.ClusterService
import com.github.cenkakin.rosebot.cluster.NewCluster
import org.jooq.DSLContext
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.OffsetDateTime

@SpringBootTest
@Testcontainers
class ClusterControllerIT {
    companion object {
        @Container
        @ServiceConnection
        val postgres = PostgreSQLContainer<Nothing>("postgres:16")

        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("prop.spring.datasource.url") { postgres.jdbcUrl }
            registry.add("prop.spring.datasource.username") { postgres.username }
            registry.add("prop.spring.datasource.password") { postgres.password }
            registry.add("prop.app.jwt.secret") { "test-secret-key-that-is-long-enough-for-hmac-sha256" }
        }
    }

    @Autowired
    lateinit var context: WebApplicationContext

    @Autowired
    lateinit var dsl: DSLContext

    @Autowired
    lateinit var clusterService: ClusterService

    lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build()
        dsl.execute("DELETE FROM cluster")
    }

    @Test
    fun `GET clusters returns active clusters`() {
        val now = OffsetDateTime.now()
        clusterService.promoteAll(
            listOf(
                NewCluster(
                    label = "AI Regulation",
                    summary = "Regulators are tightening oversight of AI.",
                    articleCount = 5,
                    windowStart = now.minusHours(24),
                    windowEnd = now,
                    feedItemIds = emptyList(),
                ),
            ),
        )

        mockMvc
            .perform(get("/api/clusters"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].label").value("AI Regulation"))
            .andExpect(jsonPath("$[0].articleCount").value(5))
    }

    @Test
    fun `GET clusters meta returns counts`() {
        mockMvc
            .perform(get("/api/clusters/meta"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.justInCount").isNumber)
            .andExpect(jsonPath("$.uncategorisedCount").isNumber)
    }
}
