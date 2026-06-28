CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tool_logs (
  id         SERIAL PRIMARY KEY,
  session_id TEXT        NOT NULL,
  tool_name  TEXT        NOT NULL,
  input      JSONB       NOT NULL,
  output     TEXT,
  status     TEXT        NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id        SERIAL PRIMARY KEY,
  board_id  TEXT,
  source    TEXT   NOT NULL,
  content   TEXT   NOT NULL,
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING hnsw (embedding vector_cosine_ops);
