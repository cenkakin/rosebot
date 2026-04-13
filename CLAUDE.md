# Rosebot — Agent Guide

## Tech Stack

- **Language**: Kotlin with `-Xjsr305=strict` compiler flag
- **Database access**: JOOQ (no JPA/Hibernate)
- **Migrations**: Flyway (single `V1__create_schema.sql`, fresh-start approach)
- **Auth**: JWT via jjwt + Spring Security, stateless sessions
- **Linting**: ktlint — format runs on `validate`, check enforced in CI
- **Tests**: Testcontainers (PostgreSQL) for integration tests

## Architecture Rules

### Bean Registration (CRITICAL)
**No `@Service`, `@Repository`, or `@Component` anywhere in domain packages.**
All beans are registered explicitly in `RosebotApiConfig`. Only expose to Spring what Spring must inject:
- Beans injected by controllers → register
- Beans injected by `SecurityConfig` → register
- Repositories → create **inline** inside the service `@Bean` method
- Internal collaborators used by only one bean → create **inline**, not a separate bean

```kotlin
// CORRECT — repository created inline, not a bean
@Bean
fun sourceService(dsl: DSLContext) = SourceService(SourceRepository(dsl))

// WRONG — don't register repository as a separate bean
@Bean fun sourceRepository(dsl: DSLContext) = SourceRepository(dsl)
@Bean fun sourceService(repo: SourceRepository) = SourceService(repo)
```

### Layer Discipline (CRITICAL)
- **Repositories** own all `DSLContext` / SQL. They return JOOQ records or domain objects.
- **Services** never inject `DSLContext`. They only call repository methods. No exceptions.
- **Controllers** never contain business logic. They delegate to a service.

If a service needs DB access, add a method to the repository and call it from the service.
Never pass `DSLContext` to a service even if it feels convenient.

### Maven Version Management (CRITICAL)
**All dependency versions live in the root `pom.xml` `<dependencyManagement>` block only.**
Submodule `pom.xml` files declare dependencies **without a `<version>` tag**.

```xml
<!-- root pom.xml — versions go here -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.github.haifengl</groupId>
      <artifactId>smile-kotlin</artifactId>
      <version>5.2.3</version>
    </dependency>
  </dependencies>
</dependencyManagement>

<!-- submodule pom.xml — no version -->
<dependency>
  <groupId>com.github.haifengl</groupId>
  <artifactId>smile-kotlin</artifactId>
</dependency>
```

### Controllers Live in rosebot-api (CRITICAL)
All `@RestController` classes live exclusively in the **`rosebot-api`** module under
`src/main/kotlin/com/github/cenkakin/rosebot/controller/`.

Domain packages (`source/`, `feed/`, `cluster/`, etc.) contain **only** `Repository`,
`Service`, and `dto/` — never a controller.

The frontend communicates **only** with endpoints in the `rosebot-api` module.

```
rosebot-api/
  controller/
    SourceController.kt      ← @RestController lives here
    FeedController.kt
    ClusterController.kt     ← NOT inside cluster/ domain package
    ...
  config/
    RosebotApiConfig.kt      ← wires all beans

cluster/                     ← domain package: Repository + Service + dto/ only
  ClusterRepository.kt
  ClusterService.kt
  dto/
```

### Domain Boundaries
- `user/` owns the `"user"` table entirely.
- `auth/` owns JWT logic and depends on `UserService` — never touches the DB directly.
- Each domain package is self-contained: `Repository`, `Service`, `dto/`, domain objects. No controllers.

### Kotlin + Spring Security Nullability
`-Xjsr305=strict` makes Spring's `@Nullable` annotations surfaced as `String?` in Kotlin. Two known cases:

```kotlin
// PasswordEncoder.encode() is @Nullable — use !! where guaranteed non-null
passwordEncoder.encode(request.password)!!

// SecurityContext.authentication is nullable
authentication!!.principal as AuthenticatedUser
```

## Database Schema

Singular table names. `user` is a PostgreSQL reserved word — always quoted as `"user"` in SQL and migrations.

JOOQ constants: `Tables.USER`, `Tables.SOURCE`, `Tables.FEED_ITEM`, `Tables.SAVED_ITEM`, `Tables.SUMMARY`, `Tables.APP_STATE`. The JOOQ `SourceType` enum lives in `jooq.enums.SourceType`; convert from domain enum via `jooq.enums.SourceType.valueOf(name)`, read back via `.literal`.

### JSONB
`FeedItemRecord.engagement` returns `org.jooq.JSONB`. Call `.data()` for the raw string:
```kotlin
get(FEED_ITEM.ENGAGEMENT)?.let { objectMapper.readValue<Map<String, Any>>(it.data()) }
```

## Configuration & Secrets

`application.yml` uses `${prop.*}` placeholders. Actual values come from:
- **Dev**: `application-dev.properties` → imports `application-dev-secrets.properties` (git-ignored)
- **Tests**: `@DynamicPropertySource` with keys `prop.spring.datasource.*` and `prop.app.jwt.secret`

Never commit `*-secrets.properties`. A `.template` file documents required secrets.

## Running & Building

```bash
# Run tests (Docker must be running for Testcontainers)
mvn -pl rosebot-api --also-make test

# Format Kotlin sources
mvn -pl rosebot-api ktlint:format

# Regenerate JOOQ sources (requires DB running)
mvn -pl rosebot-api --also-make -P generate-jooq generate-sources
```

JOOQ generated files land in `src/main/kotlin/jooq/` as Java source — do not edit them.

## Security Config

`SecurityConfig` is intentionally minimal — HTTP filter chain only. It owns `passwordEncoder()` @Bean. Do not move it to `RosebotApiConfig`. Do not add business beans here.

Public endpoints: `/api/auth/**`. Everything else requires a valid JWT Bearer token.

## Controllers — Getting the Current User

```kotlin
@GetMapping
fun list(@AuthenticationPrincipal user: AuthenticatedUser) = service.findAll(user.id)
```

The principal is set by `JwtAuthFilter` as a `UsernamePasswordAuthenticationToken` wrapping `AuthenticatedUser(id, email)`.

## Testing

Integration tests use `@SpringBootTest @Testcontainers`. There is no `@AutoConfigureMockMvc` — build `MockMvc` manually in `@BeforeEach`:
```kotlin
mockMvc = MockMvcBuilders.webAppContextSetup(context).build()
```

Follow `SourceControllerIT` as the reference pattern for new controller tests.

## Plans

All implementation plans must be written as `.md` files in the `plans/` folder at the project root.

## Adding a New Domain

1. Create package `<domain>/` with `<Domain>Repository`, `<Domain>Service`, `dto/`
2. Repository takes `DSLContext` — no Spring annotations
3. Service takes Repository — no Spring annotations
4. Add `@Bean fun <domain>Service(dsl: DSLContext) = <Domain>Service(<Domain>Repository(dsl))` to `RosebotApiConfig` (in `rosebot-api`)
5. Add `@RestController` to `rosebot-api/.../controller/<Domain>Controller.kt` — **NOT** inside the domain package
6. Write an integration test following the `SourceControllerIT` pattern
