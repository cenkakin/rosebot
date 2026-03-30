# Plan 10b — Domain Module Migration

## Answers to open questions

### 1. Module naming — drop the `rosebot-domain-` prefix

Agreed. Sub-module directories will be short names (`user`, `feed`, etc.) and their Maven
`artifactId`s will be prefixed with `rosebot-` only (e.g. `rosebot-user`) to avoid collisions
in the local Maven repo with any other project that might use generic names like `user`.

Before → After:
- `rosebot-domain-jooq`    → `jooq`       (artifactId: `rosebot-jooq`)
- `rosebot-domain-user`    → `user`       (artifactId: `rosebot-user`)
- `rosebot-domain-auth`    → `auth`       (artifactId: `rosebot-auth`)
- `rosebot-domain-source`  → `source`     (artifactId: `rosebot-source`)
- `rosebot-domain-feed`    → `feed`       (artifactId: `rosebot-feed`)
- `rosebot-domain-saved`   → `saved`      (artifactId: `rosebot-saved`)
- `rosebot-domain-summary` → `summary`    (artifactId: `rosebot-summary`)
- `rosebot-domain-appstate`→ `appstate`   (artifactId: `rosebot-appstate`)

### 2. JOOQ generated sources — one module or split per domain?

**Recommendation: keep in a single `jooq` sub-module.**

JOOQ codegen produces a *monolithic* schema representation. The files it generates include:
- `Tables.java` — references every table class
- `Keys.java` — references every record class for FK definitions
- `Indexes.java` — schema-wide
- `DefaultCatalog.java`, `Public.java` — top-level schema objects

These all live in the same `jooq` package and cross-reference each other. Splitting them across
modules (e.g. `UserRecord` in `user`, `FeedItemRecord` in `feed`) is not possible without
forking the JOOQ generator or writing complex include/exclude filters — and even then, the
shared schema-level files (`Tables`, `Keys`) would have nowhere clean to live.

**Verdict:** `jooq` is a single sub-module that all domain sub-modules depend on.

### 3. Flyway migrations — one module or split per domain?

**Recommendation: keep in a single module (`jooq`, alongside the generated schema).**

Splitting is *technically* supported by Flyway (it can scan multiple classpath locations), but
it breaks down for this schema for one reason: **cross-domain foreign keys**. For example:

- `feed_item` → `source` (FK)
- `saved_item` → `user` + `feed_item` (FK)
- `summary`   → `feed_item` (FK)

If `feed`'s migration runs before `source`'s, the FK fails. Flyway's global version ordering
(`V1`, `V2`…) would force you to manually coordinate ordering across module boundaries —
fragile and easy to break when adding a new domain.

The current schema is also deliberately a single `V1` file (fresh-start approach per CLAUDE.md).
Splitting it would require decomposing that single file into ordered per-domain fragments.

**Verdict:** Migrations stay in `jooq` alongside the generated code. If the schema grows large
enough to warrant splitting later, each migration file can be prefixed by domain
(e.g. `V2_1__feed_add_column.sql`) while still being discovered from one classpath location.

---

## Vision

`rosebot-domain` is a Maven **parent module** (`packaging=pom`) containing one sub-module per
domain area. Each sub-module is a plain Kotlin library (no Spring Boot main, no component scan).
`rosebot-api` and later `rosebot-ingestion` depend on only the sub-modules they need.

---

## Target module layout

```
rosebot/
├── pom.xml
├── rosebot-domain/
│   ├── pom.xml                  ← parent pom (packaging=pom), lists sub-modules
│   ├── jooq/                    ← JOOQ generated sources + Flyway SQL
│   │   └── pom.xml                 (artifactId: rosebot-jooq)
│   ├── user/                    ← User, UserRepository, UserService
│   │   └── pom.xml                 depends on: rosebot-jooq
│   ├── auth/                    ← JwtService, AuthService, JwtAuthFilter, AuthenticatedUser, dto/, JwtProperties
│   │   └── pom.xml                 depends on: rosebot-jooq, rosebot-user
│   ├── source/                  ← SourceType, SourceRepository, SourceService, dto/
│   │   └── pom.xml                 depends on: rosebot-jooq
│   ├── feed/                    ← FeedItemRepository, FeedService, dto/
│   │   └── pom.xml                 depends on: rosebot-jooq, rosebot-source
│   ├── saved/                   ← SavedItemRepository, SavedItemService
│   │   └── pom.xml                 depends on: rosebot-jooq
│   ├── summary/                 ← SummaryRepository, SummaryService, dto/
│   │   └── pom.xml                 depends on: rosebot-jooq
│   └── appstate/                ← AppStateRepository, AppStateService, dto/
│       └── pom.xml                 depends on: rosebot-jooq
├── rosebot-api/
└── rosebot-web-app/
```

---

## What moves where

### `jooq` sub-module
**Moves in:**
- `rosebot-api/src/main/kotlin/jooq/` → `rosebot-domain/jooq/src/main/kotlin/jooq/`
- `rosebot-api/src/main/resources/db/migration/` → `rosebot-domain/jooq/src/main/resources/db/migration/`
- JOOQ codegen Maven profile moves from `rosebot-api/pom.xml` to `rosebot-domain/jooq/pom.xml`

**Dependencies:** `spring-boot-starter-jooq`, `postgresql` (runtime), `jackson-module-kotlin`

### `user` sub-module
**Moves in:** `user/User.kt`, `user/UserRepository.kt`, `user/UserService.kt`

**Dependencies:** `rosebot-jooq`, `kotlin-reflect`

### `auth` sub-module
**Moves in:**
- `auth/AuthenticatedUser.kt`, `auth/AuthService.kt`, `auth/JwtService.kt`, `auth/JwtAuthFilter.kt`
- `auth/dto/AuthResponse.kt`, `auth/dto/LoginRequest.kt`, `auth/dto/RegisterRequest.kt`
- `config/JwtProperties.kt`

**Dependencies:** `rosebot-jooq`, `rosebot-user`, `spring-boot-starter-security`,
`spring-boot-starter-web` (JwtAuthFilter extends OncePerRequestFilter), jjwt-api/impl/jackson,
`spring-boot-starter-validation` (RegisterRequest/LoginRequest DTOs use `@NotBlank` etc. if added)

### `source` sub-module
**Moves in:** `source/SourceType.kt`, `source/JooqExtensions.kt`, `source/SourceRepository.kt`,
`source/SourceService.kt`, `source/dto/`

**Dependencies:** `rosebot-jooq`, `kotlin-reflect`

### `feed` sub-module
**Moves in:** `feed/FeedItemRecordExtensions.kt`, `feed/FeedItemRepository.kt`,
`feed/FeedService.kt`, `feed/dto/FeedItemResponse.kt`

**Dependencies:** `rosebot-jooq`, `rosebot-source`, `jackson-module-kotlin`

### `saved` sub-module
**Moves in:** `saved/SavedItemRepository.kt`, `saved/SavedItemService.kt`

**Dependencies:** `rosebot-jooq`

### `summary` sub-module
**Moves in:** `summary/SummaryRepository.kt`, `summary/SummaryService.kt`, `summary/dto/SummaryResponse.kt`

**Dependencies:** `rosebot-jooq`

### `appstate` sub-module
**Moves in:** `appstate/AppStateRepository.kt`, `appstate/AppStateService.kt`, `appstate/dto/AppStateResponse.kt`

**Dependencies:** `rosebot-jooq`

---

## `rosebot-api` after migration

**Stays:**
- `RosebotApplication.kt`
- `controller/` — all controllers (no changes)
- `config/RosebotApiConfig.kt` — bean wiring (no changes)
- `config/SecurityConfig.kt` — HTTP filter chain (no changes)
- `exception/GlobalExceptionHandler.kt` — MVC concern, stays here

**Removed:**
- `jooq/`, all domain packages, `config/JwtProperties.kt`, `db/migration/`
- JOOQ codegen profile

**New dependencies (replacing moved deps):**
```xml
<dependency>rosebot-auth</dependency>      <!-- pulls in rosebot-user transitively -->
<dependency>rosebot-source</dependency>
<dependency>rosebot-feed</dependency>      <!-- pulls in rosebot-source transitively -->
<dependency>rosebot-saved</dependency>
<dependency>rosebot-summary</dependency>
<dependency>rosebot-appstate</dependency>
<!-- Flyway stays here (triggers migrations); SQL files found via rosebot-jooq on classpath -->
<dependency>flyway-core</dependency>
<dependency>flyway-database-postgresql</dependency>
```

**Removed deps:** `spring-boot-starter-jooq`, jjwt-*, `rosebot-web-app` (keeps this)

---

## Dependency graph

```
rosebot-jooq
    ↑
    ├── rosebot-user ──────────────────────┐
    │       ↑                               │
    │       └── rosebot-auth               │  (also needs jooq, spring-web/security, jjwt)
    ├── rosebot-source ─────────────────────┤
    │       ↑                               │
    │       └── rosebot-feed               │  (also needs jooq)
    ├── rosebot-saved                       │
    ├── rosebot-summary                     │
    └── rosebot-appstate                    │
                                            ↓
                              rosebot-api  →  all of the above
```

---

## Root `pom.xml` changes

1. Add `<module>rosebot-domain</module>` before `rosebot-api`
2. Add all sub-module artifactIds to `<dependencyManagement>` with `${project.version}`

---

## Per sub-module `pom.xml` structure

- Parent: `rosebot-domain` (which inherits root `rosebot`)
- No `spring-boot-maven-plugin`
- Kotlin maven plugin **without** `spring` allopen plugin (no Spring-proxied beans)
- `<sourceDirectory>${project.basedir}/src/main/kotlin</sourceDirectory>`
- ktlint plugin (inherited from parent plugin management)

---

## Migration steps (in order)

1. Update root `pom.xml`: add `rosebot-domain` module + all sub-module artifacts to dependency management
2. Create `rosebot-domain/pom.xml` (parent, packaging=pom)
3. Create `jooq` sub-module: move `jooq/` sources + `db/migration/` + codegen profile
4. Create `user` sub-module: move `user/` package
5. Create `auth` sub-module: move `auth/` package + `config/JwtProperties.kt`
6. Create `source` sub-module: move `source/` package
7. Create `feed` sub-module: move `feed/` package
8. Create `saved` sub-module: move `saved/` package
9. Create `summary` sub-module: move `summary/` package
10. Create `appstate` sub-module: move `appstate/` package
11. Update `rosebot-api/pom.xml`: swap in domain deps, remove moved deps
12. Delete moved sources from `rosebot-api`
13. `mvn compile` — fix any classpath issues
14. `mvn test` — verify no regressions
