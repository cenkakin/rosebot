Good plan, go for it.

# Plan 04 — Input Validation on Request DTOs

## Problem

`LoginRequest`, `RegisterRequest`, `SourceRequest`, and `UpdateSourceRequest` have no constraints.
Callers can submit empty strings, unreasonably long values, or malformed emails — all of which pass
silently into the service and database layer.

---

## Dependency Change

Add `spring-boot-starter-validation` to `rosebot-api/pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

This brings in Hibernate Validator (Bean Validation 3.0) which Spring Boot auto-configures.

---

## Constraints per DTO

### `LoginRequest`

```kotlin
data class LoginRequest(
    @field:NotBlank
    @field:Email
    val email: String,

    @field:NotBlank
    @field:Size(min = 8, max = 128)
    val password: String,
)
```

### `RegisterRequest`

```kotlin
data class RegisterRequest(
    @field:NotBlank
    @field:Email
    val email: String,

    @field:NotBlank
    @field:Size(min = 8, max = 128)
    val password: String,
)
```

### `SourceRequest`

```kotlin
data class SourceRequest(
    val type: SourceType,   // already an enum — invalid values fail deserialization

    @field:NotBlank
    @field:Size(max = 128)
    val name: String,

    @field:NotBlank
    @field:Size(max = 2048)
    @field:URL
    val url: String,
)
```

### `UpdateSourceRequest`

```kotlin
data class UpdateSourceRequest(
    @field:NotBlank
    @field:Size(max = 128)
    val name: String,

    val enabled: Boolean,
)
```

---

## Controller Changes

Add `@Valid` to the `@RequestBody` parameter in each affected controller method:

```kotlin
// AuthController
fun register(@Valid @RequestBody request: RegisterRequest)
fun login(@Valid @RequestBody request: LoginRequest)

// SourceController
fun create(@Valid @RequestBody request: SourceRequest)
fun update(@PathVariable id: Long, @Valid @RequestBody request: UpdateSourceRequest)
```

---

## Exception Handler

Add a handler for `MethodArgumentNotValidException` in `GlobalExceptionHandler` to return a
structured `400 Bad Request` with field-level error messages:

```kotlin
@ExceptionHandler(MethodArgumentNotValidException::class)
fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, Any>> {
    val errors = ex.bindingResult.fieldErrors.associate { it.field to (it.defaultMessage ?: "invalid") }
    return ResponseEntity.badRequest().body(mapOf("errors" to errors))
}
```

Example response:
```json
{
  "errors": {
    "email": "must be a well-formed email address",
    "password": "size must be between 8 and 128"
  }
}
```

---

## Files Touched

| File | Change |
|---|---|
| `rosebot-api/pom.xml` | Add `spring-boot-starter-validation` dependency |
| `auth/dto/LoginRequest.kt` | Add `@Email`, `@NotBlank`, `@Size` |
| `auth/dto/RegisterRequest.kt` | Add `@Email`, `@NotBlank`, `@Size` |
| `source/dto/SourceRequest.kt` | Add `@NotBlank`, `@Size`, `@URL` |
| `source/dto/UpdateSourceRequest.kt` | Add `@NotBlank`, `@Size` |
| `controller/AuthController.kt` | Add `@Valid` to request body params |
| `controller/SourceController.kt` | Add `@Valid` to request body params |
| `exception/GlobalExceptionHandler.kt` | Add `MethodArgumentNotValidException` handler |
