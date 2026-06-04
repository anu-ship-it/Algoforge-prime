CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  sessions_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Problems
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic VARCHAR(100) NOT NULL,
  company_tags TEXT[] DEFAULT '{}',
  starter_code JSONB DEFAULT '{}',
  test_cases JSONB NOT NULL,
  constraints TEXT,
  hints TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Interview sessions
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id),
  interviewer_persona VARCHAR(100) DEFAULT 'generic',
  target_company VARCHAR(100),
  language VARCHAR(50) DEFAULT 'javascript',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  final_code TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Session messages (full conversation log)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('interviewer', 'candidate')),
  content TEXT NOT NULL,
  code_snapshot TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Code snapshots (auto-saved every 30s)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language VARCHAR(50),
  execution_result JSONB,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Debrief reports
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debrief_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  communication_score INTEGER CHECK (communication_score BETWEEN 0 AND 100),
  correctness_score INTEGER CHECK (correctness_score BETWEEN 0 AND 100),
  efficiency_score INTEGER CHECK (efficiency_score BETWEEN 0 AND 100),
  hire_recommendation VARCHAR(20) CHECK (hire_recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  strengths TEXT[],
  weaknesses TEXT[],
  missed_edge_cases TEXT[],
  optimal_solution TEXT,
  detailed_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- User skill graph (per topic performance)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  attempts INTEGER DEFAULT 0,
  successes INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  UNIQUE(user_id, topic)
);

-- ─────────────────────────────────────────
-- Refresh tokens
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_code_snapshots_session_id ON code_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_topic ON problems(topic);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ─────────────────────────────────────────
-- Seed problems
-- ─────────────────────────────────────────
INSERT INTO problems (title, slug, description, difficulty, topic, company_tags, starter_code, test_cases, constraints, hints)
VALUES
(
  'Two Sum',
  'two-sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
  'easy',
  'arrays',
  ARRAY['google', 'amazon', 'microsoft', 'meta'],
  '{"javascript": "function twoSum(nums, target) {\n  // your code here\n}", "python": "def two_sum(nums, target):\n    # your code here\n    pass", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code here\n    }\n}"}',
  '[{"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1]}, {"input": {"nums": [3,2,4], "target": 6}, "expected": [1,2]}, {"input": {"nums": [3,3], "target": 6}, "expected": [0,1]}]',
  '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, only one valid answer exists',
  ARRAY['Try using a hash map to store values you have already seen', 'For each number x, check if target - x exists in the map']
),
(
  'Valid Parentheses',
  'valid-parentheses',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of bracket, and open brackets are closed in the correct order.',
  'easy',
  'stacks',
  ARRAY['amazon', 'google', 'bloomberg', 'microsoft'],
  '{"javascript": "function isValid(s) {\n  // your code here\n}", "python": "def is_valid(s):\n    # your code here\n    pass"}',
  '[{"input": {"s": "()"}, "expected": true}, {"input": {"s": "()[]{}"}, "expected": true}, {"input": {"s": "(]"}, "expected": false}, {"input": {"s": "([)]"}, "expected": false}]',
  '1 <= s.length <= 10^4, s consists of parentheses only',
  ARRAY['What data structure naturally handles last-in first-out order?', 'Push open brackets onto a stack. When you see a closing bracket, check if the top of the stack matches.']
),
(
  'Longest Substring Without Repeating Characters',
  'longest-substring-without-repeating',
  'Given a string s, find the length of the longest substring without repeating characters.',
  'medium',
  'sliding-window',
  ARRAY['amazon', 'microsoft', 'apple', 'google', 'uber'],
  '{"javascript": "function lengthOfLongestSubstring(s) {\n  // your code here\n}", "python": "def length_of_longest_substring(s):\n    # your code here\n    pass"}',
  '[{"input": {"s": "abcabcbb"}, "expected": 3}, {"input": {"s": "bbbbb"}, "expected": 1}, {"input": {"s": "pwwkew"}, "expected": 3}]',
  '0 <= s.length <= 5 * 10^4, s consists of English letters, digits, symbols and spaces',
  ARRAY['Think sliding window with two pointers', 'Use a set to track characters in the current window', 'When you find a duplicate, move the left pointer forward until the duplicate is removed']
),
(
  'Binary Tree Level Order Traversal',
  'binary-tree-level-order',
  'Given the root of a binary tree, return the level order traversal of its node values (left to right, level by level).',
  'medium',
  'trees',
  ARRAY['meta', 'amazon', 'microsoft', 'google'],
  '{"javascript": "function levelOrder(root) {\n  // your code here\n}", "python": "def level_order(root):\n    # your code here\n    pass"}',
  '[{"input": {"root": [3,9,20,null,null,15,7]}, "expected": [[3],[9,20],[15,7]]}, {"input": {"root": [1]}, "expected": [[1]]}, {"input": {"root": []}, "expected": []}]',
  '0 <= number of nodes <= 2000, -1000 <= Node.val <= 1000',
  ARRAY['BFS is the natural fit for level-by-level traversal', 'Use a queue. At the start of each level, record the current queue size — that tells you how many nodes belong to this level.']
),
(
  'Merge K Sorted Lists',
  'merge-k-sorted-lists',
  'You are given an array of k linked-lists, each sorted in ascending order. Merge all linked-lists into one sorted linked-list and return it.',
  'hard',
  'heaps',
  ARRAY['amazon', 'google', 'microsoft', 'uber', 'airbnb'],
  '{"javascript": "function mergeKLists(lists) {\n  // your code here\n}", "python": "def merge_k_lists(lists):\n    # your code here\n    pass"}',
  '[{"input": {"lists": [[1,4,5],[1,3,4],[2,6]]}, "expected": [1,1,2,3,4,4,5,6]}, {"input": {"lists": []}, "expected": []}, {"input": {"lists": [[]]}, "expected": []}]',
  '0 <= k <= 10^4, 0 <= total nodes <= 10^4, -10^4 <= Node.val <= 10^4',
  ARRAY['A min-heap always gives you the smallest current element across all lists in O(log k)', 'Alternatively, think divide and conquer — merge pairs of lists repeatedly']
)
ON CONFLICT (slug) DO NOTHING;
