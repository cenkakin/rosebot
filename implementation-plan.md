# Rosebot — Implementation Plan

Module paths: `rosebot-api/`, `rosebot-frontend/`
Base package: `com.github.cenkakin.rosebot`

---

## Phase 1 — Clean Up Old Code

Delete all articles-related source files. The old `V1__create_articles_table.sql` migration
will be replaced — since we're still in early development, wipe the DB and start fresh.

**Delete:**
```
rosebot-api/src/main/kotlin/.../controller/ArticleController.kt
rosebot-api/src/main/kotlin/.../service/ArticleService.kt
rosebot-api/src/main/kotlin/.../repository/ArticleRepository.kt
rosebot-api/src/main/kotlin/.../dto/ArticleRequest.kt
rosebot-api/src/main/kotlin/.../dto/ArticleResponse.kt
rosebot-api/src/main/kotlin/jooq/                          ← entire directory, regenerated in Phase 5
rosebot-api/src/main/resources/db/migration/V1__create_articles_table.sql
rosebot-api/src/test/kotlin/.../controller/ArticleControllerIT.kt
```

**Keep:**
```
rosebot-api/src/main/kotlin/RosebotApplication.kt          ← nothing else to keep in existing code
```

> Note: There is no `WebConfig.kt` or `DatabaseConfig.kt` in the project — Spring Boot
> auto-configures Flyway and JOOQ from `application.yml`. No manual beans needed.

---

## Phase 2 — Add Dependencies (`rosebot-api/pom.xml`)

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

---

## Phase 3 — Secrets & Configuration

### Pattern (mirrors subscription-service)

`application-dev.properties` imports a git-ignored secrets file.
The template is committed so it's clear what secrets are required.

**`application-dev.properties`** (committed)
```properties
spring.config.import=application-dev-secrets.properties

prop.spring.datasource.url=jdbc:postgresql://localhost:5432/rosebot
prop.spring.datasource.username=rosebot
prop.spring.datasource.password=rosebot
```

**`application-dev-secrets.properties`** (git-ignored — never committed)
```properties
prop.app.jwt.secret=<generate: openssl rand -base64 32>
```

**`application-dev-secrets.properties.template`** (committed)
```properties
# JWT signing secret — min 32 chars
# Generate with: openssl rand -base64 32
prop.app.jwt.secret=<your-secret-here>
```

**`.gitignore`** — add entry:
```
*-secrets.properties
```

### `application.yml` additions
```yaml
spring:
  datasource:
    url: ${prop.spring.datasource.url}
    username: ${prop.spring.datasource.username}
    password: ${prop.spring.datasource.password}
  jooq:
    sql-dialect: POSTGRES

app:
  jwt:
    secret: ${prop.app.jwt.secret}
    expiration-ms: 86400000   # 24 hours
```

### `config/JwtProperties.kt`
```kotlin
@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val secret: String,
    val expirationMs: Long
)
```

### `config/AppConfig.kt`
```kotlin
@Configuration
@EnableConfigurationProperties(JwtProperties::class)
class AppConfig
```

---

## Phase 4 — Flyway Migrations

Fresh start — replace old V1 with the full new schema.

### `V1__create_schema.sql`
```sql
CREATE TYPE source_type AS ENUM ('NEWS', 'REDDIT', 'TWITTER');

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sources (
    id         BIGSERIAL PRIMARY KEY,
    type       source_type NOT NULL,
    name       TEXT        NOT NULL,
    url        TEXT        NOT NULL UNIQUE,
    enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feed_items (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id   TEXT        NOT NULL,
    title         TEXT        NOT NULL,
    content       TEXT,
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    author        TEXT,
    engagement    JSONB,
    published_at  TIMESTAMPTZ NOT NULL,
    ingested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_id, external_id)
);

CREATE TABLE saved_items (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_item_id BIGINT      NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
    saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, feed_item_id)
);

CREATE TABLE summaries (
    id           BIGSERIAL PRIMARY KEY,
    feed_item_id BIGINT NOT NULL UNIQUE REFERENCES feed_items(id) ON DELETE CASCADE,
    content      TEXT   NOT NULL,
    model        TEXT   NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_state (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    last_visited_at TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feed_items_published_at       ON feed_items (published_at DESC);
CREATE INDEX idx_feed_items_source_published   ON feed_items (source_id, published_at DESC);
CREATE INDEX idx_saved_items_user_saved_at     ON saved_items (user_id, saved_at DESC);
```

---

## Phase 5 — JOOQ Codegen

Add the codegen plugin in a `generate-jooq` Maven profile — opt-in only, not part of
the regular build. Run it once after Phase 4 migrations are applied.

**Add to `rosebot-api/pom.xml`:**
```xml
<profiles>
    <profile>
        <id>generate-jooq</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.jooq</groupId>
                    <artifactId>jooq-codegen-maven</artifactId>
                    <version>${jooq.version}</version>
                    <executions>
                        <execution>
                            <goals><goal>generate</goal></goals>
                        </execution>
                    </executions>
                    <configuration>
                        <jdbc>
                            <driver>org.postgresql.Driver</driver>
                            <url>jdbc:postgresql://localhost:5432/rosebot</url>
                            <user>rosebot</user>
                            <password>rosebot</password>
                        </jdbc>
                        <generator>
                            <database>
                                <name>org.jooq.meta.postgres.PostgresDatabase</name>
                                <inputSchema>public</inputSchema>
                            </database>
                            <target>
                                <packageName>jooq</packageName>
                                <directory>src/main/kotlin</directory>
                            </target>
                        </generator>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

**Run after migrations:**
```bash
docker compose up -d
# Start the app once to trigger Flyway, then:
mvn generate-sources -Pgenerate-jooq -pl rosebot-api
```

---

## Phase 6 — Package Structure

Organized by domain/feature. Controllers are the only layer kept together in one package
(they're thin wiring — no logic). Long-term, each domain package will move to its own Maven
module; the `controller/` and `config/` packages remain in the API module.

```
com.github.cenkakin.rosebot/
├── RosebotApplication.kt
├── controller/                      ← all controllers, single package
│   ├── AuthController.kt
│   ├── SourceController.kt
│   ├── FeedController.kt
│   ├── SavedItemController.kt
│   ├── SummaryController.kt
│   └── AppStateController.kt
├── config/
│   ├── AppConfig.kt
│   ├── JwtProperties.kt
│   └── SecurityConfig.kt
├── exception/
│   └── GlobalExceptionHandler.kt
├── user/                            ← user domain (DB + business logic)
│   ├── UserRepository.kt
│   ├── UserService.kt
│   └── User.kt                      ← plain data class, no JOOQ leaking out
├── auth/                            ← authentication only; depends on UserService
│   ├── AuthService.kt
│   ├── JwtService.kt
│   ├── JwtAuthFilter.kt
│   ├── AuthenticatedUser.kt
│   └── dto/
│       ├── RegisterRequest.kt
│       ├── LoginRequest.kt
│       └── AuthResponse.kt
├── source/
│   ├── SourceRepository.kt
│   ├── SourceService.kt
│   └── dto/
│       ├── SourceRequest.kt
│       ├── UpdateSourceRequest.kt
│       └── SourceResponse.kt
├── feed/
│   ├── FeedItemRepository.kt
│   ├── FeedService.kt
│   └── dto/
│       └── FeedItemResponse.kt
├── saved/
│   ├── SavedItemRepository.kt
│   ├── SavedItemService.kt
│   └── dto/
│       └── (reuses FeedItemResponse)
├── summary/
│   ├── SummaryRepository.kt
│   ├── SummaryService.kt
│   └── dto/
│       └── SummaryResponse.kt
└── appstate/
    ├── AppStateRepository.kt
    ├── AppStateService.kt
    └── dto/
        └── AppStateResponse.kt
```

---

## Phase 7 — User Domain + Auth Domain

### `config/SecurityConfig.kt`
```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig(private val jwtFilter: JwtAuthFilter) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/auth/**").permitAll()
                it.anyRequest().authenticated()
            }
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
```

---

### User Domain

The `user/` package owns everything about the users table. Auth depends on it; nothing else does.

### `user/User.kt`
```kotlin
// Plain domain object — no JOOQ types leak outside the repository
data class User(val id: Long, val email: String, val passwordHash: String)
```

### `user/UserRepository.kt`
```kotlin
@Repository
class UserRepository(private val dsl: DSLContext) {

    fun findByEmail(email: String): User? =
        dsl.selectFrom(USERS)
            .where(USERS.EMAIL.eq(email))
            .fetchOne()
            ?.toDomain()

    fun existsByEmail(email: String): Boolean =
        dsl.fetchExists(USERS, USERS.EMAIL.eq(email))

    fun create(email: String, passwordHash: String): User =
        dsl.insertInto(USERS)
            .set(USERS.EMAIL, email)
            .set(USERS.PASSWORD_HASH, passwordHash)
            .returning()
            .fetchOne()!!
            .toDomain()

    private fun UsersRecord.toDomain() = User(id!!, email!!, passwordHash!!)
}
```

### `user/UserService.kt`
```kotlin
@Service
class UserService(private val userRepository: UserRepository) {

    fun findByEmail(email: String): User? = userRepository.findByEmail(email)

    fun existsByEmail(email: String): Boolean = userRepository.existsByEmail(email)

    fun create(email: String, passwordHash: String): User =
        userRepository.create(email, passwordHash)
}
```

---

### Auth Domain

Responsible for JWT issuance and credential validation only. Delegates all user persistence to `UserService`.

### `auth/JwtService.kt`
```kotlin
@Service
class JwtService(private val props: JwtProperties) {

    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(props.secret.toByteArray())
    }

    fun generateToken(userId: Long, email: String): String =
        Jwts.builder()
            .subject(email)
            .claim("userId", userId)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + props.expirationMs))
            .signWith(key)
            .compact()

    fun extractEmail(token: String): String = parseClaims(token).subject

    fun extractUserId(token: String): Long =
        (parseClaims(token)["userId"] as Int).toLong()

    fun isValid(token: String): Boolean = runCatching {
        parseClaims(token).expiration.after(Date())
    }.getOrDefault(false)

    private fun parseClaims(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
}
```

### `auth/JwtAuthFilter.kt`
```kotlin
@Component
class JwtAuthFilter(private val jwtService: JwtService) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        val token = request.getHeader("Authorization")
            ?.takeIf { it.startsWith("Bearer ") }
            ?.substring(7)

        if (token != null && jwtService.isValid(token)) {
            val auth = UsernamePasswordAuthenticationToken(
                AuthenticatedUser(jwtService.extractUserId(token), jwtService.extractEmail(token)),
                null, emptyList()
            )
            SecurityContextHolder.getContext().authentication = auth
        }

        chain.doFilter(request, response)
    }
}
```

### `auth/AuthenticatedUser.kt`
```kotlin
data class AuthenticatedUser(val id: Long, val email: String)

// Extension on SecurityContext for use in controllers
fun SecurityContext.currentUser(): AuthenticatedUser =
    authentication.principal as AuthenticatedUser
```

### `auth/AuthService.kt`
```kotlin
@Service
class AuthService(
    private val userService: UserService,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService
) {
    fun register(request: RegisterRequest): AuthResponse {
        if (userService.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already registered")
        }
        val user = userService.create(request.email, passwordEncoder.encode(request.password))
        return AuthResponse(jwtService.generateToken(user.id, user.email))
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userService.findByEmail(request.email)
            ?: throw IllegalArgumentException("Invalid credentials")

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid credentials")
        }
        return AuthResponse(jwtService.generateToken(user.id, user.email))
    }
}
```

### `controller/AuthController.kt`
```kotlin
@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@RequestBody request: RegisterRequest): AuthResponse =
        authService.register(request)

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): AuthResponse =
        authService.login(request)
}
```

---

## Phase 8 — Source Domain

### `source/SourceRepository.kt`
```kotlin
@Repository
class SourceRepository(private val dsl: DSLContext) {

    fun findAll(): List<SourcesRecord> =
        dsl.selectFrom(SOURCES).orderBy(SOURCES.CREATED_AT.asc()).fetch()

    fun findById(id: Long): SourcesRecord? =
        dsl.selectFrom(SOURCES).where(SOURCES.ID.eq(id)).fetchOne()

    fun create(request: SourceRequest): SourcesRecord =
        dsl.insertInto(SOURCES)
            .set(SOURCES.TYPE, request.type.toJooqEnum())
            .set(SOURCES.NAME, request.name)
            .set(SOURCES.URL, request.url)
            .returning().fetchOne()!!

    fun update(id: Long, name: String, enabled: Boolean): SourcesRecord? =
        dsl.update(SOURCES)
            .set(SOURCES.NAME, name)
            .set(SOURCES.ENABLED, enabled)
            .where(SOURCES.ID.eq(id))
            .returning().fetchOne()

    fun delete(id: Long): Boolean =
        dsl.deleteFrom(SOURCES).where(SOURCES.ID.eq(id)).execute() > 0
}
```

### `controller/SourceController.kt`
```kotlin
@RestController
@RequestMapping("/api/sources")
class SourceController(private val service: SourceService) {

    @GetMapping
    fun listAll(): List<SourceResponse> = service.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: SourceRequest): SourceResponse =
        service.create(request)

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateSourceRequest
    ): SourceResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) = service.delete(id)
}
```

---

## Phase 9 — Feed Domain

### `feed/dto/FeedItemResponse.kt`
```kotlin
data class FeedItemResponse(
    val id: Long,
    val sourceId: Long,
    val sourceType: String,
    val sourceName: String,
    val title: String,
    val content: String?,
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: String,
    val saved: Boolean        // resolved per-user at query time
)
```

### `feed/FeedItemRepository.kt`
```kotlin
@Repository
class FeedItemRepository(private val dsl: DSLContext) {

    fun findFeed(
        userId: Long,
        before: OffsetDateTime?,
        limit: Int,
        sourceId: Long?,
        type: SourceType?
    ): List<Record> =
        dsl.select(
                FEED_ITEMS.asterisk(),
                SOURCES.TYPE,
                SOURCES.NAME,
                SAVED_ITEMS.ID.isNotNull.`as`("saved")
            )
            .from(FEED_ITEMS)
            .join(SOURCES).on(SOURCES.ID.eq(FEED_ITEMS.SOURCE_ID))
            .leftJoin(SAVED_ITEMS).on(
                SAVED_ITEMS.FEED_ITEM_ID.eq(FEED_ITEMS.ID)
                    .and(SAVED_ITEMS.USER_ID.eq(userId))
            )
            .where(
                DSL.noCondition()
                    .and(before?.let { FEED_ITEMS.PUBLISHED_AT.lt(it) } ?: DSL.noCondition())
                    .and(sourceId?.let { FEED_ITEMS.SOURCE_ID.eq(it) } ?: DSL.noCondition())
                    .and(type?.let { SOURCES.TYPE.eq(it.toJooqEnum()) } ?: DSL.noCondition())
            )
            .orderBy(FEED_ITEMS.PUBLISHED_AT.desc())
            .limit(limit)
            .fetch()

    fun findById(id: Long): FeedItemsRecord? =
        dsl.selectFrom(FEED_ITEMS).where(FEED_ITEMS.ID.eq(id)).fetchOne()
}
```

### `controller/FeedController.kt`
```kotlin
@RestController
@RequestMapping("/api/feed")
class FeedController(private val service: FeedService) {

    @GetMapping
    fun getFeed(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(required = false) sourceId: Long?,
        @RequestParam(required = false) type: String?
    ): List<FeedItemResponse> =
        service.getFeed(user.id, before, limit.coerceAtMost(50), sourceId, type)

    @GetMapping("/{id}")
    fun getOne(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: Long
    ): FeedItemResponse = service.getById(user.id, id)
}
```

---

## Phase 10 — Saved Items Domain

### `saved/SavedItemRepository.kt`
```kotlin
@Repository
class SavedItemRepository(private val dsl: DSLContext) {

    fun findByUser(userId: Long, before: OffsetDateTime?, limit: Int): List<Record> =
        dsl.select(
                FEED_ITEMS.asterisk(),
                SOURCES.TYPE,
                SOURCES.NAME,
                DSL.inline(true).`as`("saved")
            )
            .from(SAVED_ITEMS)
            .join(FEED_ITEMS).on(FEED_ITEMS.ID.eq(SAVED_ITEMS.FEED_ITEM_ID))
            .join(SOURCES).on(SOURCES.ID.eq(FEED_ITEMS.SOURCE_ID))
            .where(SAVED_ITEMS.USER_ID.eq(userId))
            .and(before?.let { SAVED_ITEMS.SAVED_AT.lt(it) } ?: DSL.noCondition())
            .orderBy(SAVED_ITEMS.SAVED_AT.desc())
            .limit(limit)
            .fetch()

    fun save(userId: Long, feedItemId: Long) =
        dsl.insertInto(SAVED_ITEMS)
            .set(SAVED_ITEMS.USER_ID, userId)
            .set(SAVED_ITEMS.FEED_ITEM_ID, feedItemId)
            .onConflictDoNothing()
            .execute()

    fun delete(userId: Long, feedItemId: Long): Boolean =
        dsl.deleteFrom(SAVED_ITEMS)
            .where(
                SAVED_ITEMS.USER_ID.eq(userId)
                    .and(SAVED_ITEMS.FEED_ITEM_ID.eq(feedItemId))
            )
            .execute() > 0
}
```

### `controller/SavedItemController.kt`
```kotlin
@RestController
@RequestMapping("/api/saved")
class SavedItemController(private val service: SavedItemService) {

    @GetMapping
    fun getSaved(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int
    ): List<FeedItemResponse> =
        service.getSaved(user.id, before, limit.coerceAtMost(50))

    @PostMapping("/{feedItemId}")
    @ResponseStatus(HttpStatus.CREATED)
    fun save(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable feedItemId: Long
    ) = service.save(user.id, feedItemId)

    @DeleteMapping("/{feedItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unsave(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable feedItemId: Long
    ) = service.unsave(user.id, feedItemId)
}
```

---

## Phase 11 — App State Domain

### `appstate/AppStateRepository.kt`
```kotlin
@Repository
class AppStateRepository(private val dsl: DSLContext) {

    fun findByUser(userId: Long): OffsetDateTime? =
        dsl.selectFrom(APP_STATE)
            .where(APP_STATE.USER_ID.eq(userId))
            .fetchOne()
            ?.lastVisitedAt

    fun upsertVisited(userId: Long, now: OffsetDateTime) {
        dsl.insertInto(APP_STATE)
            .set(APP_STATE.USER_ID, userId)
            .set(APP_STATE.LAST_VISITED_AT, now)
            .set(APP_STATE.UPDATED_AT, now)
            .onConflict(APP_STATE.USER_ID).doUpdate()
            .set(APP_STATE.LAST_VISITED_AT, now)
            .set(APP_STATE.UPDATED_AT, now)
            .execute()
    }
}
```

### `appstate/AppStateService.kt`
```kotlin
@Service
class AppStateService(private val appStateRepository: AppStateRepository) {

    fun get(userId: Long): AppStateResponse =
        AppStateResponse(lastVisitedAt = appStateRepository.findByUser(userId)?.toInstant()?.toString())

    fun markVisited(userId: Long): AppStateResponse {
        val now = OffsetDateTime.now()
        appStateRepository.upsertVisited(userId, now)
        return AppStateResponse(lastVisitedAt = now.toInstant().toString())
    }
}
```

### `controller/AppStateController.kt`
```kotlin
@RestController
@RequestMapping("/api/app-state")
class AppStateController(private val service: AppStateService) {

    @GetMapping
    fun get(@AuthenticationPrincipal user: AuthenticatedUser): AppStateResponse =
        service.get(user.id)

    @PutMapping("/visited")
    fun markVisited(@AuthenticationPrincipal user: AuthenticatedUser): AppStateResponse =
        service.markVisited(user.id)
}
```

---

## Phase 12 — Summaries Domain (Stub)

Returns 404 until LLM integration is added in the ingestion phase.

### `summary/SummaryRepository.kt`
```kotlin
@Repository
class SummaryRepository(private val dsl: DSLContext) {

    fun findByFeedItem(feedItemId: Long): SummariesRecord? =
        dsl.selectFrom(SUMMARIES)
            .where(SUMMARIES.FEED_ITEM_ID.eq(feedItemId))
            .fetchOne()
}
```

### `summary/SummaryService.kt`
```kotlin
@Service
class SummaryService(private val summaryRepository: SummaryRepository) {

    fun get(feedItemId: Long): SummaryResponse =
        summaryRepository.findByFeedItem(feedItemId)
            ?.let { SummaryResponse(it.content!!, it.model!!, it.generatedAt!!.toInstant().toString()) }
            ?: throw NoSuchElementException("No summary for feed item $feedItemId")
}
```

### `controller/SummaryController.kt`
```kotlin
@RestController
@RequestMapping("/api/summaries")
class SummaryController(private val service: SummaryService) {

    @GetMapping("/{feedItemId}")
    fun get(@PathVariable feedItemId: Long): SummaryResponse =
        service.get(feedItemId)

    @PostMapping("/{feedItemId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun request(@PathVariable feedItemId: Long) =
        service.request(feedItemId)
}
```

---

## Phase 13 — Global Exception Handler

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse(ex.message ?: "Not found"))

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse(ex.message ?: "Bad request"))

    @ExceptionHandler(AccessDeniedException::class)
    fun handleForbidden(): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse("Forbidden"))
}

data class ErrorResponse(val error: String)
```

---

## Phase 14 — Integration Tests

One IT class per controller. Pattern identical to the existing `ArticleControllerIT`:
Testcontainers PostgreSQL + manual `MockMvcBuilders` setup (no `@AutoConfigureMockMvc` — removed in Spring Boot 4).

Each test class registers a user and obtains a JWT in `@BeforeEach`, then passes it as
`Authorization: Bearer <token>` on every request.

```kotlin
@SpringBootTest
@Testcontainers
class SourceControllerIT {

    @Autowired lateinit var context: WebApplicationContext
    @Autowired lateinit var objectMapper: ObjectMapper

    private lateinit var mockMvc: MockMvc
    private lateinit var token: String

    companion object {
        @Container @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres:17").apply {
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
            registry.add("prop.app.jwt.secret") { "test-secret-key-must-be-at-least-32-chars" }
        }
    }

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build()
        token = registerAndLogin("test@example.com", "password123")
    }

    private fun registerAndLogin(email: String, password: String): String {
        val body = objectMapper.writeValueAsString(RegisterRequest(email, password))
        val response = mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andReturn().response.contentAsString
        return objectMapper.readValue(response, AuthResponse::class.java).token
    }

    @Test
    fun `POST creates source and GET returns it`() {
        val request = objectMapper.writeValueAsString(
            SourceRequest(SourceType.NEWS, "The Verge", "https://theverge.com/rss")
        )
        mockMvc.post("/api/sources") {
            contentType = MediaType.APPLICATION_JSON
            content = request
            header("Authorization", "Bearer $token")
        }.andExpect { status { isCreated() } }

        mockMvc.get("/api/sources") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].name") { value("The Verge") }
        }
    }
}
```
