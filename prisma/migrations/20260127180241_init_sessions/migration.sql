-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'DELETE');

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL DEFAULT 'global',
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "opencode_server" TEXT NOT NULL DEFAULT 'http://127.0.0.1:4096',
    "directory" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_updated_at_idx" ON "sessions"("updated_at" DESC);
