import {
  Blocks,
  LayoutDashboard,
  Monitor,
  Bell,
  Network,
  Package,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Users,
  MessagesSquare,
  AudioWaveform,
  Bot,
  Shield,
  Menu,
  Lock,
} from "lucide-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "新炬网络",
      logo: AudioWaveform,
      plan: "OS-Native 智能平台",
    },
  ],
  navGroups: [
    {
      title: "主导航",
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
          title: "技能箱",
          url: "/skills",
          icon: Package,
        },
        {
          title: "智能协作",
          url: "/chats",
          badge: "3",
          icon: MessagesSquare,
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
