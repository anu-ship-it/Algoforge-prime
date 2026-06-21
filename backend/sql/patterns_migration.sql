-- Enable pgvector for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────
-- Companies
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Company interview patterns
-- Scraped from LeetCode Discuss posts
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,         -- e.g. "dynamic programming"
  pattern_name VARCHAR(255) NOT NULL,  -- e.g. "longest common subsequence"
  frequency INTEGER DEFAULT 1,         -- how many times reported
  last_reported TIMESTAMPTZ DEFAULT NOW(),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  role_levels TEXT[] DEFAULT '{}',     -- e.g. ['L4', 'L5', 'SDE2']
  source_urls TEXT[] DEFAULT '{}',     -- original discuss post URLs
  embedding vector(768),               -- for semantic similarity (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Scraped discuss posts (raw data)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraped_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(50) DEFAULT 'leetcode_discuss',
  post_id VARCHAR(255) UNIQUE NOT NULL,
  company_slug VARCHAR(100),
  title TEXT,
  content TEXT,
  author VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  post_date TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- User prep plans
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_prep_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  company_slug VARCHAR(100) NOT NULL,
  target_role VARCHAR(100),
  target_level VARCHAR(50),
  interview_date DATE,
  days_until_interview INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_slug, status)
);

-- ─────────────────────────────────────────
-- Prep plan items (ordered problem queue)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prep_plan_id UUID REFERENCES user_prep_plans(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id),
  position INTEGER NOT NULL,           -- order in the queue
  priority_score NUMERIC(5,2),        -- higher = more important
  reason TEXT,                         -- why this problem was included
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_patterns_company_id ON company_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_company_patterns_topic ON company_patterns(topic);
CREATE INDEX IF NOT EXISTS idx_company_patterns_frequency ON company_patterns(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_company ON scraped_posts(company_slug);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_processed ON scraped_posts(processed);
CREATE INDEX IF NOT EXISTS idx_prep_plan_items_plan_id ON prep_plan_items(prep_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_prep_plans_user_id ON user_prep_plans(user_id);

-- ─────────────────────────────────────────
-- Seed companies
-- ─────────────────────────────────────────
INSERT INTO companies (name, slug, description) VALUES
('Google', 'google', 'Alphabet subsidiary, known for scalability-focused interviews'),
('Amazon', 'amazon', 'Known for LP questions and edge case heavy coding rounds'),
('Meta', 'meta', 'Fast-paced interviews focused on optimal solutions'),
('Microsoft', 'microsoft', 'Collaborative interviews focused on problem solving approach'),
('Apple', 'apple', 'System design heavy, strong emphasis on fundamentals'),
('Uber', 'uber', 'Real-world problem solving, geospatial and graph problems common'),
('Stripe', 'stripe', 'API design, distributed systems, strong backend focus'),
('Airbnb', 'airbnb', 'Full stack focus, system design and product sense'),
('Netflix', 'netflix', 'Senior roles only, heavy system design'),
('LinkedIn', 'linkedin', 'Graph problems very common, social network algorithms')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────
-- Seed known patterns per company
-- Based on publicly known interview patterns
-- ─────────────────────────────────────────
INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'arrays', 'Two Sum variants', 45, 'easy', ARRAY['L3','L4','SDE1']
FROM companies c WHERE c.slug = 'google'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'graphs', 'BFS/DFS on grid', 38, 'medium', ARRAY['L4','L5','SDE2']
FROM companies c WHERE c.slug = 'google'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'dynamic-programming', 'Knapsack variants', 32, 'hard', ARRAY['L5','L6']
FROM companies c WHERE c.slug = 'google'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'trees', 'Binary tree traversals', 41, 'medium', ARRAY['L4','L5']
FROM companies c WHERE c.slug = 'google'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'arrays', 'Sliding window', 52, 'medium', ARRAY['SDE1','SDE2']
FROM companies c WHERE c.slug = 'amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'trees', 'LCA and path problems', 44, 'medium', ARRAY['SDE2','SDE3']
FROM companies c WHERE c.slug = 'amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'heaps', 'Top K elements', 39, 'medium', ARRAY['SDE1','SDE2']
FROM companies c WHERE c.slug = 'amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'graphs', 'Shortest path algorithms', 35, 'hard', ARRAY['SDE2','SDE3']
FROM companies c WHERE c.slug = 'amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'arrays', 'Two pointers', 48, 'easy', ARRAY['E4','E5']
FROM companies c WHERE c.slug = 'meta'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'graphs', 'Graph connectivity', 43, 'medium', ARRAY['E4','E5']
FROM companies c WHERE c.slug = 'meta'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'dynamic-programming', 'String DP', 37, 'hard', ARRAY['E5','E6']
FROM companies c WHERE c.slug = 'meta'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'trees', 'Binary search tree operations', 40, 'medium', ARRAY['E4','E5']
FROM companies c WHERE c.slug = 'meta'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'arrays', 'Binary search', 42, 'medium', ARRAY['59','60','63']
FROM companies c WHERE c.slug = 'microsoft'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'stacks', 'Monotonic stack', 33, 'medium', ARRAY['60','63']
FROM companies c WHERE c.slug = 'microsoft'
ON CONFLICT DO NOTHING;

INSERT INTO company_patterns (company_id, topic, pattern_name, frequency, difficulty, role_levels)
SELECT c.id, 'graphs', 'Topological sort', 29, 'hard', ARRAY['63','65']
FROM companies c WHERE c.slug = 'microsoft'
ON CONFLICT DO NOTHING;
