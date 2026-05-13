import { Router } from "express";
import { McpServicesController } from "../controllers/mcp-services.controller.js";
import { McpMarketplaceController } from "../controllers/mcp-marketplace.controller.js";
import { McpCategoriesController } from "../controllers/mcp-categories.controller.js";
import { McpTagsController } from "../controllers/mcp-tags.controller.js";
import { jwtAuthMiddleware } from "../middleware/jwt-auth.middleware.js";

const router = Router();

// ============================================
// 公开路由（无需认证）
// ============================================

// MCP 市场路由
router.get("/marketplace", McpMarketplaceController.getMarketplaceList);

// 分类路由
router.get("/categories", McpCategoriesController.getCategories);

// 标签路由（只读）
router.get("/tags", McpTagsController.getTags);

// ============================================
// 需要认证的路由
// ============================================
router.use(jwtAuthMiddleware);

// MCP 服务管理路由
router.get("/my-services", McpServicesController.getMyServices);
router.post("/services", McpServicesController.createService);
router.get("/services/:mcpId", McpServicesController.getServiceDetail);
router.put("/services/:mcpId", McpServicesController.updateService);
router.delete("/services/:mcpId", McpServicesController.deleteService);
router.post("/services/:mcpId/health-check", McpServicesController.healthCheck);
router.post("/services/:mcpId/restart", McpServicesController.restartService);
router.post("/services/:mcpId/load", McpServicesController.loadToChatServers);
router.post(
  "/services/:mcpId/unload",
  McpServicesController.unloadFromChatServers,
);

// MCP 工具和资源路由
router.get("/services/:mcpId/tools", McpServicesController.getTools);
router.get("/services/:mcpId/resources", McpServicesController.getResources);

// 标签管理路由（需要认证）
router.post("/tags", McpTagsController.createTag);

export default router;
