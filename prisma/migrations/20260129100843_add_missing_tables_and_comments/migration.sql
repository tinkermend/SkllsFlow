/*
  Warnings:

  - The `status` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `user_id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "role_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('active', 'delete');

-- CreateEnum
CREATE TYPE "menu_type" AS ENUM ('menu', 'button');

-- CreateEnum
CREATE TYPE "menu_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "agent_mode" AS ENUM ('primary', 'subagent', 'all');

-- CreateEnum
CREATE TYPE "skill_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "mcp_transport_type" AS ENUM ('stdio', 'sse', 'websocket');

-- CreateEnum
CREATE TYPE "mcp_status" AS ENUM ('active', 'inactive', 'error', 'maintenance');

-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('user', 'assistant', 'system');

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "user_id",
ADD COLUMN     "user_id" BIGINT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "session_status" NOT NULL DEFAULT 'active';

-- DropEnum
DROP TYPE "SessionStatus";

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "user_uuid" UUID NOT NULL,
    "account_no" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "login_failed_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" "role_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "parent_id" BIGINT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "type" "menu_type" NOT NULL DEFAULT 'menu',
    "permission" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "status" "menu_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_menus" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "menu_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "temperature" DECIMAL(3,2),
    "max_steps" INTEGER,
    "system_prompt" TEXT,
    "tools_permissions" JSONB,
    "action_permissions" JSONB,
    "mode" "agent_mode" NOT NULL DEFAULT 'all',
    "model" VARCHAR(255),
    "additional_params" JSONB,
    "config_content" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" BIGINT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" BIGSERIAL NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "category" VARCHAR(100) NOT NULL,
    "tags" VARCHAR(180)[],
    "status" "skill_status" NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "file_path" VARCHAR(255) NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_services" (
    "id" BIGSERIAL NOT NULL,
    "mcp_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50),
    "transport_type" "mcp_transport_type" NOT NULL,
    "connection_config" JSONB NOT NULL,
    "env_vars" JSONB NOT NULL DEFAULT '{}',
    "encrypted_auth_info" TEXT,
    "cached_capabilities" JSONB NOT NULL DEFAULT '{}',
    "status" "mcp_status" NOT NULL DEFAULT 'inactive',
    "last_health_check_at" TIMESTAMP(3),
    "health_check_result" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "message_id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "role" "message_role" NOT NULL,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_agents" (
    "session_id" VARCHAR(100) NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_agents_pkey" PRIMARY KEY ("session_id","agent_id")
);

-- CreateTable
CREATE TABLE "session_mcps" (
    "session_id" VARCHAR(100) NOT NULL,
    "mcp_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_mcps_pkey" PRIMARY KEY ("session_id","mcp_id")
);

-- CreateTable
CREATE TABLE "session_skills" (
    "session_id" VARCHAR(100) NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_skills_pkey" PRIMARY KEY ("session_id","skill_id")
);

-- CreateTable
CREATE TABLE "user_skill" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "skill_id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_uuid_key" ON "users"("user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_account_no_key" ON "users"("account_no");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_user_uuid_idx" ON "users"("user_uuid");

-- CreateIndex
CREATE INDEX "users_account_no_idx" ON "users"("account_no");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_code_idx" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_status_idx" ON "roles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_device_id_idx" ON "refresh_tokens"("device_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "menus_parent_id_idx" ON "menus"("parent_id");

-- CreateIndex
CREATE INDEX "menus_sort_idx" ON "menus"("sort");

-- CreateIndex
CREATE INDEX "menus_status_idx" ON "menus"("status");

-- CreateIndex
CREATE INDEX "role_menus_role_id_idx" ON "role_menus"("role_id");

-- CreateIndex
CREATE INDEX "role_menus_menu_id_idx" ON "role_menus"("menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_menus_role_id_menu_id_key" ON "role_menus"("role_id", "menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_agent_id_key" ON "agents"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_name_key" ON "agents"("name");

-- CreateIndex
CREATE INDEX "agents_mode_idx" ON "agents"("mode");

-- CreateIndex
CREATE INDEX "agents_disabled_idx" ON "agents"("disabled");

-- CreateIndex
CREATE UNIQUE INDEX "skills_skill_id_key" ON "skills"("skill_id");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_status_idx" ON "skills"("status");

-- CreateIndex
CREATE INDEX "skills_sort_order_idx" ON "skills"("sort_order");

-- CreateIndex
CREATE INDEX "skills_category_status_sort_order_idx" ON "skills"("category", "status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_services_mcp_id_key" ON "mcp_services"("mcp_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_services_name_key" ON "mcp_services"("name");

-- CreateIndex
CREATE INDEX "mcp_services_mcp_id_idx" ON "mcp_services"("mcp_id");

-- CreateIndex
CREATE INDEX "mcp_services_status_idx" ON "mcp_services"("status");

-- CreateIndex
CREATE INDEX "mcp_services_transport_type_idx" ON "mcp_services"("transport_type");

-- CreateIndex
CREATE UNIQUE INDEX "messages_message_id_key" ON "messages"("message_id");

-- CreateIndex
CREATE INDEX "messages_session_id_idx" ON "messages"("session_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_session_id_created_at_idx" ON "messages"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "session_agents_agent_id_idx" ON "session_agents"("agent_id");

-- CreateIndex
CREATE INDEX "session_mcps_mcp_id_idx" ON "session_mcps"("mcp_id");

-- CreateIndex
CREATE INDEX "session_skills_skill_id_idx" ON "session_skills"("skill_id");

-- CreateIndex
CREATE INDEX "user_skill_user_id_idx" ON "user_skill"("user_id");

-- CreateIndex
CREATE INDEX "user_skill_skill_id_idx" ON "user_skill"("skill_id");

-- CreateIndex
CREATE INDEX "user_skill_session_id_idx" ON "user_skill"("session_id");

-- CreateIndex
CREATE INDEX "user_skill_user_id_session_id_sort_order_idx" ON "user_skill"("user_id", "session_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_skill_user_id_skill_id_session_id_key" ON "user_skill"("user_id", "skill_id", "session_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_agents" ADD CONSTRAINT "session_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_mcps" ADD CONSTRAINT "session_mcps_mcp_id_fkey" FOREIGN KEY ("mcp_id") REFERENCES "mcp_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_skills" ADD CONSTRAINT "session_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;
