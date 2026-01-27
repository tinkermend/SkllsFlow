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
} from 'lucide-react'
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "管理员",
    email: "tinkermend@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "新炬网络",
      logo: AudioWaveform,
      plan: "AIOps智能平台",
    },
  ],
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
          title: "用户管理",
          url: "/users",
          icon: Users,
        },
        {
          title: "系统设置",
          icon: Settings,
          items: [
            {
              title: "个人资料",
              url: "/settings",
              icon: UserCog,
            },
            {
              title: "账户",
              url: "/settings/account",
              icon: Wrench,
            },
            {
              title: "外观",
              url: "/settings/appearance",
              icon: Palette,
            },
            {
              title: "通知",
              url: "/settings/notifications",
              icon: Bell,
            },
            {
              title: "显示",
              url: "/settings/display",
              icon: Monitor,
            },
          ],
        },
      ],
    },
  ],
};
