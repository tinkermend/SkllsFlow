-- Add Task Center data model

-- Create enums
CREATE TYPE "aiops"."task_schedule_type" AS ENUM ('manual', 'daily', 'weekly', 'monthly');
CREATE TYPE "aiops"."task_status" AS ENUM ('active', 'paused', 'disabled');
CREATE TYPE "aiops"."task_run_status" AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
CREATE TYPE "aiops"."task_run_trigger_type" AS ENUM ('manual', 'test', 'schedule');

-- Create tables
CREATE TABLE "aiops"."tasks" (
    "id" BIGSERIAL NOT NULL,
    "task_uuid" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "chat_server_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,
    "prompt" TEXT NOT NULL,
    "schedule_type" "aiops"."task_schedule_type" NOT NULL DEFAULT 'manual',
    "schedule_config" JSONB,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 300,
    "status" "aiops"."task_status" NOT NULL DEFAULT 'active',
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiops"."task_runs" (
    "id" BIGSERIAL NOT NULL,
    "run_uuid" UUID NOT NULL,
    "task_id" BIGINT,
    "status" "aiops"."task_run_status" NOT NULL DEFAULT 'pending',
    "trigger_type" "aiops"."task_run_trigger_type" NOT NULL,
    "input" JSONB NOT NULL,
    "output" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "tasks_task_uuid_key" ON "aiops"."tasks"("task_uuid");
CREATE UNIQUE INDEX "task_runs_run_uuid_key" ON "aiops"."task_runs"("run_uuid");

-- Create indexes
CREATE INDEX "tasks_created_by_idx" ON "aiops"."tasks"("created_by");
CREATE INDEX "tasks_status_idx" ON "aiops"."tasks"("status");
CREATE INDEX "tasks_next_run_at_idx" ON "aiops"."tasks"("next_run_at");
CREATE INDEX "tasks_created_by_status_idx" ON "aiops"."tasks"("created_by", "status");
CREATE INDEX "task_runs_task_id_idx" ON "aiops"."task_runs"("task_id");
CREATE INDEX "task_runs_status_idx" ON "aiops"."task_runs"("status");
CREATE INDEX "task_runs_created_at_idx" ON "aiops"."task_runs"("created_at");
CREATE INDEX "task_runs_task_id_created_at_idx" ON "aiops"."task_runs"("task_id", "created_at");

-- Add foreign keys
ALTER TABLE "aiops"."tasks" ADD CONSTRAINT "tasks_chat_server_id_fkey" FOREIGN KEY ("chat_server_id") REFERENCES "aiops"."chat_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aiops"."tasks" ADD CONSTRAINT "tasks_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "aiops"."skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aiops"."tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "aiops"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aiops"."task_runs" ADD CONSTRAINT "task_runs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "aiops"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
