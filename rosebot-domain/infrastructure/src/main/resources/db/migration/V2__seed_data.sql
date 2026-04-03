-- =============================================================================
-- Seed data for local development and manual testing
-- Login: test@rosebot.dev / password
-- Password hash: BCrypt cost 10 of "password"
-- =============================================================================

-- ── User ─────────────────────────────────────────────────────────────────────

INSERT INTO "user" (email, password_hash) VALUES
    ('test@rosebot.dev', '$2a$10$RZJfnu5MloWZU2u6Pkiyw.4LSNfWVrXCvhsoL3IBbvPBLToU0NAYO');


-- ── Sources ──────────────────────────────────────────────────────────────────

INSERT INTO source (type, name, url) VALUES
    ('NEWS',    'The Verge',      'https://www.theverge.com/rss/index.xml'),
    ('NEWS',    'BBC World',      'https://feeds.bbci.co.uk/news/world/rss.xml'),
    ('NEWS',    'Wired',          'https://www.wired.com/feed/rss'),
    ('NEWS',    'Jacobin',          'https://jacobin.com/feed'),
    ('REDDIT',  'r/technology',   'https://www.reddit.com/r/technology.json'),
    ('REDDIT',  'r/programming',  'https://www.reddit.com/r/programming.json'),
    ('TWITTER', '@naval',         'https://twitter.com/naval'),
    ('TWITTER', '@paulg',         'https://twitter.com/paulg');


-- ── Feed Items ───────────────────────────────────────────────────────────────
-- Times are relative to migration run so the "New / Earlier Today / Yesterday"
-- grouping in the UI works out of the box.

INSERT INTO feed_item (source_id, external_id, title, summary, url, thumbnail_url, author, engagement, published_at) VALUES

    -- ── New (within last 4 hours) ────────────────────────────────────────────

    (
        (SELECT id FROM source WHERE name = 'The Verge'),
        'verge-gpt5-001',
        'OpenAI announces GPT-5 with advanced reasoning capabilities',
        'The model shows significant improvements in multi-step reasoning tasks, scoring 94% on benchmarks previously unseen by any model. Access rolls out in two phases: Plus subscribers get it next week, API access follows in 30 days.',
        'https://www.theverge.com/openai-gpt5-reasoning',
        'https://picsum.photos/seed/gpt5/400/300',
        NULL,
        NULL,
        NOW() - INTERVAL '1 hour'
    ),
    (
        (SELECT id FROM source WHERE name = '@naval'),
        'naval-ai-jobs-001',
        'The thing about AI replacing jobs is that everyone is simultaneously overestimating the short-term and underestimating the long-term.',
        'We have seen this pattern with the internet, mobile, and cloud. Each time, the immediate disruption was overhyped but the ten-year transformation was underhyped. AI is no different.',
        'https://twitter.com/naval/status/1001',
        NULL,
        '@naval',
        '{"likes": 3124, "retweets": 481}',
        NOW() - INTERVAL '2 hours'
    ),
    (
        (SELECT id FROM source WHERE name = 'r/technology'),
        'reddit-tech-stack-2026',
        'Ask HN: What''s your current stack in 2026?',
        'Top comment threads converge on a few themes: Spring Boot and React still dominate enterprise, largely due to hiring and tooling maturity. Rust is seeing strong growth in systems and infra work but is still niche for product teams.',
        'https://news.ycombinator.com/item?id=40012345',
        NULL,
        NULL,
        '{"upvotes": 2147, "comments": 847}',
        NOW() - INTERVAL '3 hours'
    ),

    -- ── Earlier Today (4h–24h ago) ────────────────────────────────────────────

    (
        (SELECT id FROM source WHERE name = 'BBC World'),
        'bbc-eu-ai-act-001',
        'EU passes sweeping AI regulation bill with 312–201 vote',
        'The legislation requires transparency reports for all frontier models and introduces mandatory red-teaming before public deployment. Non-compliance carries fines up to 6% of global annual revenue.',
        'https://www.bbc.co.uk/news/eu-ai-act-2026',
        'https://picsum.photos/seed/euai/400/300',
        NULL,
        NULL,
        NOW() - INTERVAL '7 hours'
    ),
    (
        (SELECT id FROM source WHERE name = '@paulg'),
        'pg-downturns-001',
        'Startups that win in downturns aren''t the ones that cut the most — they''re the ones that cut the right things and double down on what matters.',
        'The companies that came out strongest after 2008 and 2020 all share one trait: they treated the downturn as a forcing function for focus, not just a mandate to shrink.',
        'https://twitter.com/paulg/status/1002',
        NULL,
        '@paulg',
        '{"likes": 1401, "retweets": 201}',
        NOW() - INTERVAL '9 hours'
    ),
    (
        (SELECT id FROM source WHERE name = 'Wired'),
        'wired-quantum-001',
        'Google''s new quantum chip achieves 1 million qubit milestone',
        'Researchers demonstrated error-corrected logical qubits at a scale previously thought to be a decade away. The result was independently verified by two university labs.',
        'https://www.wired.com/google-quantum-milestone',
        'https://picsum.photos/seed/quantum/400/300',
        NULL,
        NULL,
        NOW() - INTERVAL '12 hours'
    ),
    (
        (SELECT id FROM source WHERE name = 'r/technology'),
        'reddit-remote-work-2026',
        'Remote work is quietly winning: 62% of tech workers now fully remote, survey finds',
        'Despite high-profile return-to-office mandates at large companies, the broader tech market has shifted decisively remote. Smaller companies are using it as a hiring advantage.',
        'https://www.reddit.com/r/technology/remote-work-survey',
        NULL,
        NULL,
        '{"upvotes": 5832, "comments": 1203}',
        NOW() - INTERVAL '18 hours'
    ),

    -- ── Yesterday ────────────────────────────────────────────────────────────

    (
        (SELECT id FROM source WHERE name = 'r/programming'),
        'reddit-python-rust-001',
        'Why we migrated 2 million lines of Python to Rust — and what we learned',
        'A fintech company documented 18 months of gradual migration. p99 latency dropped from 380ms to 42ms on their core pricing engine. Memory usage fell 70%. The unexpected bottleneck was hiring — Rust engineers cost 40% more and ramp up slower.',
        'https://www.reddit.com/r/programming/python-to-rust',
        NULL,
        NULL,
        '{"upvotes": 4312, "comments": 1204}',
        NOW() - INTERVAL '28 hours'
    ),
    (
        (SELECT id FROM source WHERE name = 'The Verge'),
        'verge-apple-vision-2-001',
        'Apple Vision Pro 2 review: finally the product the original promised to be',
        'The second generation cuts weight by 40%, adds all-day battery life, and drops the price to $2,499. The spatial computing use case has finally found its killer app in collaborative 3D design.',
        'https://www.theverge.com/apple-vision-pro-2-review',
        'https://picsum.photos/seed/vision2/400/300',
        NULL,
        NULL,
        NOW() - INTERVAL '32 hours'
    ),
    (
        (SELECT id FROM source WHERE name = '@naval'),
        'naval-reading-001',
        'Reading is the meta-skill of all skills. It compounds faster than any other investment you can make in yourself.',
        'Most people stop reading seriously after school. The ones who don''t end up running the ones who did.',
        'https://twitter.com/naval/status/1003',
        NULL,
        '@naval',
        '{"likes": 8742, "retweets": 1532}',
        NOW() - INTERVAL '36 hours'
    ),

    -- ── Two Days Ago ─────────────────────────────────────────────────────────

    (
        (SELECT id FROM source WHERE name = 'BBC World'),
        'bbc-climate-summit-001',
        'COP32 ends with historic carbon pricing agreement signed by 140 nations',
        'For the first time, a binding global carbon price floor of $50 per tonne was agreed, covering 78% of global emissions. Implementation begins in 2027.',
        'https://www.bbc.co.uk/news/cop32-carbon-price',
        'https://picsum.photos/seed/cop32/400/300',
        NULL,
        NULL,
        NOW() - INTERVAL '50 hours'
    ),
    (
        (SELECT id FROM source WHERE name = 'r/programming'),
        'reddit-typescript-6-001',
        'TypeScript 6.0 ships with native Go-style error handling — the community is divided',
        'The new `using` keyword combined with `Result<T, E>` types gives TypeScript first-class error handling without exceptions. Purists are concerned about diverging too far from JavaScript semantics.',
        'https://www.reddit.com/r/programming/typescript-6-error-handling',
        NULL,
        NULL,
        '{"upvotes": 7651, "comments": 2341}',
        NOW() - INTERVAL '52 hours'
    );


-- ── Feed Item Content ─────────────────────────────────────────────────────────
-- Full article content for non-Twitter items (Twitter items have no scraped content)

INSERT INTO feed_item_content (feed_item_id, content) VALUES
    (
        (SELECT id FROM feed_item WHERE external_id = 'verge-gpt5-001'),
        '<p>GPT-5 introduces a dedicated "chain-of-thought" API mode that exposes intermediate reasoning steps to developers. The model scores 94% on the MATH benchmark and 87% on competitive coding tasks — both records.</p>
<p>Access rolls out in two phases: Plus subscribers get it next week, API access follows in 30 days. Pricing is unchanged from GPT-4. OpenAI also announced a new fine-tuning pipeline optimised for reasoning tasks.</p>
<h3>What changes for developers</h3>
<p>The new <code>reasoning_effort</code> parameter lets callers trade cost for depth. Setting it to <code>high</code> enables full chain-of-thought; <code>low</code> matches GPT-4 behaviour at the same price point.</p>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'reddit-tech-stack-2026'),
        '<p>Top comment threads converge on a few themes: Spring Boot + React remains the default enterprise choice, largely due to hiring and tooling maturity. Rust is seeing strong growth in systems and infra work but is still niche for product teams.</p>
<p>Surprising finding: a large cohort still maintains Vue 2 in production. Go continues to dominate for new backend services at mid-sized companies. Several comments call out Kotlin Multiplatform gaining traction for shared business logic.</p>
<h3>Top voted comment</h3>
<blockquote>We tried to migrate off Spring Boot twice. Both times we came back. The ecosystem depth is just unmatched for enterprise requirements.</blockquote>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'bbc-eu-ai-act-001'),
        '<p>The EU AI Act passed its final vote, requiring transparency reports for all frontier AI models and mandatory independent red-teaming before public deployment. The rules apply to any company serving EU users, regardless of where they are headquartered.</p>
<p>Companies have 18 months to comply. Non-compliance carries fines up to 6% of global annual revenue. The US and UK have signalled they are monitoring the legislation closely but have no immediate plans to adopt equivalent rules.</p>
<h3>Key obligations under the Act</h3>
<ul>
  <li>Annual transparency reports for all general-purpose AI models above 10^25 FLOPs</li>
  <li>Mandatory red-team testing by accredited third parties before public release</li>
  <li>Incident reporting within 72 hours of discovering a systemic risk</li>
  <li>Open access to model weights for academic research upon request</li>
</ul>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'reddit-python-rust-001'),
        '<p>A fintech company documented 18 months of gradual Python to Rust migration. Latency improvements were real: p99 dropped from 380ms to 42ms on their core pricing engine. Memory usage fell by 70%.</p>
<p>The unexpected bottleneck: hiring. Rust engineers cost ~40% more and take longer to ramp up. They recommend a hybrid approach — migrate only the hot path, keep Python for glue code and business logic.</p>
<h3>Performance results</h3>
<table>
  <thead><tr><th>Metric</th><th>Python</th><th>Rust</th></tr></thead>
  <tbody>
    <tr><td>p99 latency</td><td>380ms</td><td>42ms</td></tr>
    <tr><td>Memory (peak)</td><td>4.2 GB</td><td>1.3 GB</td></tr>
    <tr><td>Throughput</td><td>1,200 rps</td><td>9,400 rps</td></tr>
  </tbody>
</table>
<p>The post ends with a candid admission: they would not do a full rewrite again.</p>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'reddit-typescript-6-001'),
        '<p>TypeScript 6.0 introduces a <code>Result&lt;T, E&gt;</code> type and a <code>using</code> keyword for Go-style error handling, letting developers avoid try/catch entirely for expected error paths.</p>
<p>The community is split: functional-programming advocates love it, while others argue it fragments TypeScript''s identity as a typed superset of JavaScript. The TypeScript team has committed to keeping the feature opt-in via a compiler flag.</p>
<h3>Example</h3>
<pre><code>using result = await fetchUser(id)
if (result.err) {
  console.error(result.err)
  return
}
console.log(result.val.name)</code></pre>
<p>Migration tooling (<code>ts-migrate-errors</code>) is already available on npm.</p>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'wired-quantum-001'),
        '<p>Google researchers demonstrated error-corrected logical qubits at a scale previously thought to be a decade away. The result was independently verified by two university labs.</p>
<p>The chip, codenamed Willow-2, achieves coherence times of 300 microseconds — ten times longer than its predecessor. Error rates per gate operation have fallen below the threshold needed for practical quantum advantage on chemistry simulations.</p>
<h3>What this enables</h3>
<ul>
  <li>Drug discovery simulations currently intractable for classical computers</li>
  <li>Cryptographic key breaking (still years away at useful scale)</li>
  <li>Materials science — designing room-temperature superconductors</li>
</ul>'
    ),
    (
        (SELECT id FROM feed_item WHERE external_id = 'verge-apple-vision-2-001'),
        '<p>Apple Vision Pro 2 cuts weight by 40% through a new titanium-aluminium composite frame and moves the battery fully into the headset, achieving all-day use on a single charge.</p>
<p>At $2,499 — $1,000 less than the original — it finally reaches the price tier where enterprise adoption makes sense. The killer app turns out to be collaborative 3D design: multiple users can occupy the same spatial workspace and manipulate shared models in real time.</p>
<h3>Verdict</h3>
<blockquote>This is the product the original Vision Pro promised. The hardware is finally out of the way. Whether the software ecosystem catches up is the open question.</blockquote>'
    );


-- ── Saved Items (a few items saved for the test user) ────────────────────────

INSERT INTO saved_item (user_id, feed_item_id, saved_at) VALUES
    (
        (SELECT id FROM "user" WHERE email = 'test@rosebot.dev'),
        (SELECT id FROM feed_item WHERE external_id = 'bbc-eu-ai-act-001'),
        NOW() - INTERVAL '6 hours'
    ),
    (
        (SELECT id FROM "user" WHERE email = 'test@rosebot.dev'),
        (SELECT id FROM feed_item WHERE external_id = 'reddit-python-rust-001'),
        NOW() - INTERVAL '25 hours'
    ),
    (
        (SELECT id FROM "user" WHERE email = 'test@rosebot.dev'),
        (SELECT id FROM feed_item WHERE external_id = 'reddit-typescript-6-001'),
        NOW() - INTERVAL '48 hours'
    );


-- ── App State ────────────────────────────────────────────────────────────────
-- last_visited_at is 4 hours ago, so the 3 items published within the last
-- 3 hours will show up as "New" in the UI on first login.

INSERT INTO app_state (user_id, last_visited_at, updated_at) VALUES
    (
        (SELECT id FROM "user" WHERE email = 'test@rosebot.dev'),
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '4 hours'
    );
