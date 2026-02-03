-- Active: 1770086534756@@127.0.0.1@5432@aiops@aiops
-- Add created_by column to sessions table
ALTER TABLE "aiops"."sessions"
ADD COLUMN "created_by" BIGINT;

-- Backfill created_by using the owning chat server
UPDATE "aiops"."sessions" AS s
SET "created_by" = cs."created_by"
FROM "aiops"."chat_servers" AS cs
WHERE s."chat_id" = cs."id";

-- Ensure the column is not null after backfill
ALTER TABLE "aiops"."sessions"
ALTER COLUMN "created_by" SET NOT NULL;

-- Add foreign key constraint referencing users table
ALTER TABLE "aiops"."sessions"
ADD CONSTRAINT "sessions_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "aiops"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create supporting indexes for query patterns
CREATE INDEX "idx_sessions_created_by"
  ON "aiops"."sessions" ("created_by");

CREATE INDEX "idx_sessions_created_by_chat_id"
  ON "aiops"."sessions" ("created_by", "chat_id");


