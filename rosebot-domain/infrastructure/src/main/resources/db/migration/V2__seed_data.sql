-- =============================================================================
-- Seed data for local development and manual testing
-- Login: test@rosebot.dev / password
-- Password hash: BCrypt cost 10 of "password"
-- =============================================================================

-- ── User ─────────────────────────────────────────────────────────────────────

INSERT INTO "user" (email, password_hash) VALUES
    ('test@rosebot.dev', '$2a$10$RZJfnu5MloWZU2u6Pkiyw.4LSNfWVrXCvhsoL3IBbvPBLToU0NAYO');


-- ── Sources ──────────────────────────────────────────────────────────────────

INSERT INTO source (type, name, url, homepage) VALUES
    ('NEWS', 'BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://www.bbc.co.uk'),
    ('NEWS', 'Jacobin',   'https://jacobin.com/feed',                    'https://jacobin.com');
