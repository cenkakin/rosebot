-- =============================================================================
-- Seed data for local development and manual testing
-- Login: test@rosebot.dev / password
-- Password hash: BCrypt cost 10 of "password"
-- =============================================================================

-- ── User ─────────────────────────────────────────────────────────────────────

INSERT INTO "user" (email, password_hash) VALUES
    ('test@rosebot.dev', '$2a$10$RZJfnu5MloWZU2u6Pkiyw.4LSNfWVrXCvhsoL3IBbvPBLToU0NAYO');


-- ── Sources ──────────────────────────────────────────────────────────────────

INSERT INTO source (type, name, url, homepage, stance)
VALUES
    ('NEWS', 'World Socialist Web Site', 'http://www.wsws.org/en/rss.xml', 'https://www.wsws.org', 1),
    ('NEWS', 'Monthly Review', 'https://monthlyreview.org/feed/', 'https://monthlyreview.org', 1),
    ('NEWS', 'Jacobin', 'https://jacobin.com/feed', 'https://jacobin.com', 2),
    ('NEWS', 'Left Voice', 'https://www.leftvoice.org/feed/', 'https://www.leftvoice.org', 1),
    ('NEWS', 'Red Flag', 'https://redflag.org.au/feed/', 'https://redflag.org.au', 1),
    ('NEWS', 'rs21', 'https://www.rs21.org.uk/feed/', 'https://www.rs21.org.uk', 1),
    ('NEWS', 'Tempest', 'https://tempestmag.org/feed/', 'https://tempestmag.org', 1),
    ('NEWS', 'Reuters', 'https://www.reuters.com/world/', 'https://www.reuters.com', 3),
    ('NEWS', 'BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'https://www.bbc.com/news', 3),
    ('NEWS', 'The Guardian', 'https://www.theguardian.com/world/rss', 'https://www.theguardian.com', 2),
    ('NEWS', 'Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'https://www.aljazeera.com', 2),
    ('NEWS', 'NPR News', 'https://feeds.npr.org/1001/rss.xml', 'https://www.npr.org', 2),
    ('NEWS', 'Vox', 'https://www.vox.com/rss/index.xml', 'https://www.vox.com', 2),
    ('NEWS', 'The Washington Post', 'https://feeds.washingtonpost.com/rss/world', 'https://www.washingtonpost.com', 2),
    ('NEWS', 'The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'https://www.nytimes.com', 2),
    ('NEWS', 'Deutsche Welle', 'https://rss.dw.com/rdf/rss-en-all', 'https://www.dw.com', 3),
    ('NEWS', 'BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://www.bbc.co.uk', 3),
    ('NEWS', 'Drop Site News', 'https://api.substack.com/feed/podcast/2510348/s/153051.rss', 'https://www.dropsitenews.com', 1),
    ('NEWS', 'Evrensel', 'https://www.evrensel.net/rss/haber.xml', 'https://www.evrensel.net', 1);
