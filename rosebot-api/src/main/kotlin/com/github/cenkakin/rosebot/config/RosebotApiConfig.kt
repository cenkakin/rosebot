package com.github.cenkakin.rosebot.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.cenkakin.rosebot.appstate.AppStateRepository
import com.github.cenkakin.rosebot.appstate.AppStateService
import com.github.cenkakin.rosebot.auth.AuthService
import com.github.cenkakin.rosebot.auth.JwtAuthFilter
import com.github.cenkakin.rosebot.auth.JwtService
import com.github.cenkakin.rosebot.feed.FeedItemRepository
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.saved.SavedItemRepository
import com.github.cenkakin.rosebot.saved.SavedItemService
import com.github.cenkakin.rosebot.source.SourceRepository
import com.github.cenkakin.rosebot.source.SourceService
import com.github.cenkakin.rosebot.summary.SummaryRepository
import com.github.cenkakin.rosebot.summary.SummaryService
import com.github.cenkakin.rosebot.user.UserRepository
import com.github.cenkakin.rosebot.user.UserService
import org.jooq.DSLContext
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
@EnableConfigurationProperties(JwtProperties::class)
class RosebotApiConfig {

    @Bean
    fun jwtService(props: JwtProperties) = JwtService(props)

    @Bean
    fun jwtAuthFilter(jwtService: JwtService) = JwtAuthFilter(jwtService)

    @Bean
    fun authService(
        dsl: DSLContext,
        passwordEncoder: PasswordEncoder,
        jwtService: JwtService,
    ) = AuthService(UserService(UserRepository(dsl)), passwordEncoder, jwtService)

    @Bean
    fun sourceService(dsl: DSLContext) = SourceService(SourceRepository(dsl))

    @Bean
    fun feedService(dsl: DSLContext, objectMapper: ObjectMapper) =
        FeedService(FeedItemRepository(dsl), objectMapper)

    @Bean
    fun savedItemService(dsl: DSLContext, objectMapper: ObjectMapper) =
        SavedItemService(SavedItemRepository(dsl), objectMapper)

    @Bean
    fun appStateService(dsl: DSLContext) = AppStateService(AppStateRepository(dsl))

    @Bean
    fun summaryService(dsl: DSLContext) = SummaryService(SummaryRepository(dsl))
}
