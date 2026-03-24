-- 001_create_tables.sql
-- Run this directly against the production database.
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS).

-- ============ ACTION ITEMS ============

CREATE TABLE IF NOT EXISTS review_action_items (
  id SERIAL PRIMARY KEY,
  property_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  action TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'to_acknowledge',
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assignee VARCHAR(255),
  due_date TIMESTAMP,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  quoted_review_id VARCHAR(255),
  quoted_review_comment TEXT,
  quoted_review_rating NUMERIC(3,1),
  quoted_review_guest VARCHAR(255),
  quoted_review_date TIMESTAMP,
  quoted_inventory_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS review_action_item_comments (
  id SERIAL PRIMARY KEY,
  action_item_id INTEGER REFERENCES review_action_items(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_property ON review_action_items(property_name);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON review_action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_item_comments_item ON review_action_item_comments(action_item_id);

-- Add columns that may not exist on older installations
ALTER TABLE review_action_items ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE review_action_items ADD COLUMN IF NOT EXISTS assignee VARCHAR(255);
ALTER TABLE review_action_items ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_action_items_priority ON review_action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON review_action_items(assignee);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON review_action_items(due_date);

-- ============ REVIEW REACTIONS ============

CREATE TABLE IF NOT EXISTS review_reactions (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(255) NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, emoji, user_name)
);

CREATE INDEX IF NOT EXISTS idx_reactions_review ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_reactions_property ON review_reactions(property_name);
