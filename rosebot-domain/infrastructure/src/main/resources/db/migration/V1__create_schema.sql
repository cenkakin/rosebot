CREATE TYPE source_type AS ENUM ('NEWS', 'REDDIT', 'TWITTER');

CREATE TABLE "user" (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL CONSTRAINT uq_user_email UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE source (
    id         BIGSERIAL PRIMARY KEY,
    type       source_type NOT NULL,
    name       TEXT        NOT NULL,
    url        TEXT        NOT NULL UNIQUE,
    enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feed_item (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES source(id) ON DELETE CASCADE,
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

CREATE TABLE saved_item (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    feed_item_id BIGINT      NOT NULL REFERENCES feed_item(id) ON DELETE CASCADE,
    saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, feed_item_id)
);

CREATE TABLE summary (
    id           BIGSERIAL PRIMARY KEY,
    feed_item_id BIGINT NOT NULL UNIQUE REFERENCES feed_item(id) ON DELETE CASCADE,
    content      TEXT   NOT NULL,
    model        TEXT   NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_state (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    last_visited_at TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feed_item_published_at     ON feed_item (published_at DESC);
CREATE INDEX idx_feed_item_source_published ON feed_item (source_id, published_at DESC);
CREATE INDEX idx_saved_item_user_saved_at   ON saved_item (user_id, saved_at DESC);
