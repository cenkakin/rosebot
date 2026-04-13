CREATE TYPE source_type AS ENUM ('NEWS', 'REDDIT', 'TWITTER');

CREATE TYPE cluster_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

CREATE TABLE "user" (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL CONSTRAINT uq_user_email UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE source (
    id         BIGSERIAL   PRIMARY KEY,
    type       source_type NOT NULL,
    name       TEXT        NOT NULL,
    url        TEXT        NOT NULL UNIQUE,
    homepage   TEXT        NOT NULL,
    enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Must be defined before feed_item (FK reference)
CREATE TABLE cluster (
    id            BIGSERIAL      PRIMARY KEY,
    label         VARCHAR(200)   NOT NULL,
    summary       TEXT           NOT NULL,
    status        cluster_status NOT NULL DEFAULT 'PENDING',
    article_count INT            NOT NULL,
    window_start  TIMESTAMPTZ    NOT NULL,
    window_end    TIMESTAMPTZ    NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cluster_status ON cluster(status);

CREATE TABLE feed_item (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES source(id) ON DELETE CASCADE,
    external_id   TEXT        NOT NULL,
    title         TEXT        NOT NULL,
    summary       TEXT,
    ai_summary    TEXT,
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    author        TEXT,
    engagement    JSONB,
    published_at  TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ,
    ingested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    cluster_id    BIGINT      REFERENCES cluster(id) ON DELETE SET NULL,
    UNIQUE (source_id, external_id)
);

CREATE INDEX idx_feed_item_published_at     ON feed_item (published_at DESC);
CREATE INDEX idx_feed_item_source_published ON feed_item (source_id, published_at DESC);
CREATE INDEX idx_feed_item_cluster          ON feed_item (cluster_id);

CREATE TABLE feed_item_content (
    id           BIGSERIAL PRIMARY KEY,
    feed_item_id BIGINT NOT NULL UNIQUE REFERENCES feed_item(id) ON DELETE CASCADE,
    content      TEXT   NOT NULL,
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE embedding (
    id           BIGSERIAL    PRIMARY KEY,
    feed_item_id BIGINT       NOT NULL REFERENCES feed_item(id) ON DELETE CASCADE,
    model        VARCHAR(100) NOT NULL DEFAULT 'nomic-embed-text',
    vector       FLOAT4[]     NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (feed_item_id, model)
);

CREATE INDEX idx_embedding_feed_item ON embedding(feed_item_id);

CREATE INDEX idx_feed_item_unsummarised ON feed_item (ingested_at ASC)
    WHERE ai_summary IS NULL;

CREATE TABLE saved_item (
    id           BIGSERIAL   PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    feed_item_id BIGINT      NOT NULL REFERENCES feed_item(id) ON DELETE CASCADE,
    saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, feed_item_id)
);

CREATE INDEX idx_saved_item_user_saved_at ON saved_item (user_id, saved_at DESC);

CREATE TABLE app_state (
    id              BIGSERIAL   PRIMARY KEY,
    user_id         BIGINT      NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    last_visited_at TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Singleton row for system-wide state (not per-user)
CREATE TABLE system_state (
    id                BIGSERIAL   PRIMARY KEY CHECK (id = 1),
    last_clustered_at TIMESTAMPTZ
);

INSERT INTO system_state (last_clustered_at) VALUES (NULL);
