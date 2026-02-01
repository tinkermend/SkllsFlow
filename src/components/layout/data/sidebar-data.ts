import {
  Blocks,
  LayoutDashboard,
  Network,
  Package,
  Settings,
  Users,
  Bot,
  Shield,
  Menu,
  Lock,
  Server,
  Eye,
  AlertTriangle,
  MessageSquare,
  FileText,
  Activity,
  Phone,
} from "lucide-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      items: [
        {
          title: "仪表盘",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "智能对话",
          url: "/ai-chat",
          icon: Bot,
        },
        {
          title: "技能管理",
          url: "/skills",
          icon: Package,
        },
        {
          title: "MCP管理",
          url: "/mcp-management",
          icon: Blocks,
        },
        {
          title: "Agent管理",
          url: "/agent-management",
          icon: Network,
        },
        {
          title: "服务管理",
          url: "/service-management",
          icon: Server,
        },
        {
          title: "可观测性",
          url: "/observability",
          icon: Eye,
        },
        {
          title: "告警管理",
          url: "/alert-management",
          icon: AlertTriangle,
        },
        {
          title: "集群对话",
          url: "/cluster-chat",
          icon: MessageSquare,
        },
        {
          title: "外部调用",
          url: "/external-calls",
          icon: Phone,
        },
        {
          title: "日志管理",
          icon: FileText,
          items: [
            {
              title: "操作日志",
              url: "/logs/operation",
              icon: Activity,
            },
            {
              title: "对话日志",
              url: "/logs/chat",
              icon: MessageSquare,
            },
          ],
        },
        {
          title: "系统管理",
          icon: Settings,
          items: [
            {
              title: "用户管理",
              url: "/users",
              icon: Users,
            },
            {
              title: "角色管理",
              url: "/settings/roles",
              icon: Shield,
            },
            {
              title: "权限管理",
              url: "/settings/permissions",
              icon: Lock,
            },
            {
              title: "菜单管理",
              url: "/settings/menus",
              icon: Menu,
            },
          ],
        },
      ],
    },
  ],
};
