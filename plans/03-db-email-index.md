Good plan, go for it.

# Plan 03 — DB: Email Index on `user` Table

## Problem

There is no index on the `email` column of the `"user"` table. Every call to
`POST /api/auth/login` and `POST /api/auth/register` performs a full table scan to look up the user
by email. Uniqueness is also only enforced in application code, not at the database level — a race
between two concurrent registrations with the same email could slip through.

## Fix

Add a `UNIQUE INDEX` on `"user"(email)` directly inside `V1__create_schema.sql`.

```sql
CREATE UNIQUE INDEX ON "user"(email);
```

Place it immediately after the `CREATE TABLE "user"` block.

### Why edit V1 directly?

Per the project's "fresh-start" Flyway approach (documented in `CLAUDE.md`), the database is always
recreated from scratch. There is no live migration history to preserve. Editing V1 in place is
therefore correct — a separate V3 migration would be misleading, implying the index was an
afterthought rather than part of the original schema intent.

### What this gives us

1. **Performance** — login/register become index lookups instead of full scans.
2. **DB-level uniqueness** — a duplicate email insert will throw a `DataIntegrityViolationException`
   even if two requests race past the application-level check simultaneously.
3. **Exception handling** — `GlobalExceptionHandler` should catch
   `DataIntegrityViolationException` and return `409 Conflict` with a friendly error message, since
   this can now surface from the DB directly. This is a small addition to `GlobalExceptionHandler`.

## Files Touched

| File | Change |
|---|---|
| `db/migration/V1__create_schema.sql` | Add `CREATE UNIQUE INDEX ON "user"(email)` |
| `exception/GlobalExceptionHandler.kt` | Add handler for `DataIntegrityViolationException` → 409 |
