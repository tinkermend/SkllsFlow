import {
  Blocks,
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Network,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Bot,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '管理员',
    email: 'tinkermend@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: '新炬网络',
      logo: AudioWaveform,
      plan: 'AIOps智能平台',
    },
  ],
  navGroups: [
    {
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '智能对话',
          url: '/ai-chat',
          icon: Bot,
        },
        {
          title: 'MCP管理',
          url: '/mcp-management',
          icon: Blocks,
        },
        {
          title: 'Agent管理',
          url: '/agent-management',
          icon: Network,
        },
        {
          title: '任务',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: '技能管理',
          url: '/apps',
          icon: Package,
        },
        {
          title: '智能协作',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: '用户',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      items: [
        {
          title: '认证',
          icon: ShieldCheck,
          items: [
            {
              title: '登录 (双栏)',
              url: '/sign-in',
            },
          ],
        },
        {
          title: '错误页面',
          icon: Bug,
          items: [
            {
              title: '未授权',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: '禁止访问',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: '页面不存在',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: '服务器错误',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: '系统维护',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          title: '设置',
          icon: Settings,
          items: [
            {
              title: '个人资料',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: '账户',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: '外观',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: '通知',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: '显示',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
