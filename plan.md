# Rosebot — Backend DB & API Plan

## Entity Relationship Overview

```
users ──< saved_items
users ──< app_state
sources ──< feed_items ──< saved_items
                 └──────< summaries
```

---

## Entities

### `users`
Basic authentication. Single user initially but modelled correctly from the start.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `email` | `TEXT NOT NULL UNIQUE` | |
| `password_hash` | `TEXT NOT NULL` | Bcrypt hashed — never store plain text |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

### `sources`
What the user subscribes to.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `type` | `source_type` (enum) | `NEWS`, `REDDIT`, `TWITTER` |
| `name` | `TEXT NOT NULL` | Display name — "The Verge", "r/technology", "@naval" |
| `url` | `TEXT NOT NULL UNIQUE` | Canonical identifier — RSS feed URL, subreddit URL, profile URL |
| `enabled` | `BOOLEAN DEFAULT TRUE` | Soft toggle without deletion |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

### `feed_items`
The content ingested from sources. Central table.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `source_id` | `BIGINT FK → sources.id` | |
| `external_id` | `TEXT NOT NULL` | Original ID from the platform (tweet ID, Reddit post ID, article GUID) |
| `title` | `TEXT NOT NULL` | Headline or first line of tweet |
| `content` | `TEXT` | Truncated preview (~280 chars) |
| `url` | `TEXT NOT NULL` | Link to original |
| `thumbnail_url` | `TEXT` | Optional image |
| `author` | `TEXT` | Byline, @handle, u/username |
| `engagement` | `JSONB` | Type-specific stats — see below |
| `published_at` | `TIMESTAMPTZ NOT NULL` | Original publish time |
| `ingested_at` | `TIMESTAMPTZ DEFAULT now()` | When we fetched it |

**Unique constraint:** `(source_id, external_id)` — prevents duplicates on re-fetch.

**`engagement` JSONB shape by type:**
```json
// Twitter
{ "likes": 312, "retweets": 48, "replies": 12 }

// Reddit
{ "upvotes": 2100, "comments": 847, "ratio": 0.95 }

// News
{ "readTimeMinutes": 5 }
```

JSONB is used here because engagement fields differ by source type and are display-only
(never filtered/sorted on), so flexibility outweighs strict typing.

---

### `saved_items`
User's bookmarked items. Separate table (not a boolean on `feed_items`) so it can
grow — notes, tags, folders later.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `user_id` | `BIGINT FK → users.id` | |
| `feed_item_id` | `BIGINT FK → feed_items.id` | |
| `saved_at` | `TIMESTAMPTZ DEFAULT now()` | |

**Unique constraint:** `(user_id, feed_item_id)` — one save per item per user.

`ON DELETE CASCADE` on both FKs — if a user or item is removed, saves go too.

---

### `summaries`
AI-generated summaries. Only exists for items where a summary was requested/generated.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `feed_item_id` | `BIGINT FK → feed_items.id UNIQUE` | One summary per item |
| `content` | `TEXT NOT NULL` | The summary text |
| `model` | `TEXT NOT NULL` | e.g. `claude-haiku-4-5` — important for debugging/versioning |
| `generated_at` | `TIMESTAMPTZ DEFAULT now()` | |

One-to-one with `feed_items` via the `UNIQUE` constraint. Not user-scoped — summaries
are shared across users since they're derived from the same source content.

---

### `app_state`
Per-user lightweight global state.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `user_id` | `BIGINT FK → users.id UNIQUE` | One row per user |
| `last_visited_at` | `TIMESTAMPTZ` | Powers the "new since last visit" banner |
| `updated_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

## Indexes

```sql
-- Primary feed query: all items ordered by time
CREATE INDEX idx_feed_items_published_at ON feed_items (published_at DESC);

-- Feed filtered by source
CREATE INDEX idx_feed_items_source_published ON feed_items (source_id, published_at DESC);

-- Deduplication on ingest
CREATE UNIQUE INDEX idx_feed_items_source_external ON feed_items (source_id, external_id);

-- Saved feed query per user
CREATE INDEX idx_saved_items_user_saved_at ON saved_items (user_id, saved_at DESC);
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account (email + password) |
| `POST` | `/api/auth/login` | Returns JWT |
| `POST` | `/api/auth/logout` | Invalidate session |

All endpoints below require a valid JWT.

### Sources
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sources` | List all sources |
| `POST` | `/api/sources` | Add a new source |
| `PUT` | `/api/sources/{id}` | Update source (name, enabled toggle) |
| `DELETE` | `/api/sources/{id}` | Remove a source |

### Feed
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/feed` | Paginated feed, reverse chronological. Query params: `before` (cursor timestamp), `limit`, `sourceId`, `type` |
| `GET` | `/api/feed/{id}` | Single feed item |

### Saved
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/saved` | List saved items (paginated, `before` cursor, `limit`) |
| `POST` | `/api/saved/{feedItemId}` | Save an item |
| `DELETE` | `/api/saved/{feedItemId}` | Unsave an item |

### Summaries
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/summaries/{feedItemId}` | Get summary for an item (404 if not yet generated) |
| `POST` | `/api/summaries/{feedItemId}` | Request summary generation |

### App State
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/app-state` | Get current user's app state (incl. `last_visited_at`) |
| `PUT` | `/api/app-state/visited` | Update `last_visited_at` to now (called on feed load) |

---

## Deferred / Out of Scope for Now

- **No ingestion config per source** — fetch interval, keyword filters belong in the ingestion layer.
- **No tags/folders on saved items** — table is ready to extend.
- **Data retention/cleanup** — a scheduled job deleting `feed_items` older than N days
  (excluding saved ones) is an ingestion concern, not modelled here.
- **Summary generation logic** — the `POST /api/summaries/{feedItemId}` endpoint is
  stubbed for now; actual LLM integration is part of the ingestion phase.
