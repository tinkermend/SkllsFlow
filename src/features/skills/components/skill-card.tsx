import { useMemo } from "react";
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/use-permission";
import { parseIcon } from "@/lib/icon-parser";
import { SkillStatus, type Skill } from "../types";

interface SkillCardProps {
  skill: Skill;
  mode?: "my-skills" | "platform-skills"; // 新增：区分我的技能和平台技能
  onViewDetails?: (skillId: string) => void;
  onUninstall?: (skillId: string) => void;
  onDelete?: (skillId: string) => void; // 新增：删除技能（平台技能）
  onInstall?: (skillId: string) => void; // 新增：装载技能（平台技能）
  onToggleStatus?: (skillId: string, currentStatus: SkillStatus) => void; // 新增：切换状态（平台技能）
}

export function SkillCard({
  skill,
  mode = "my-skills",
  onViewDetails,
  onUninstall,
  onDelete,
  onInstall,
  onToggleStatus,
}: SkillCardProps) {
  const { can } = usePermission();

  // 解析图标字符串为 React 组件
  const IconComponent = useMemo(() => parseIcon(skill.icon), [skill.icon]);

  const statusConfig = {
    [SkillStatus.ACTIVE]: {
      label: "可用",
      variant: "default" as const,
      className:
        "bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0",
    },
    [SkillStatus.DISABLED]: {
      label: "已禁用",
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-500 hover:bg-gray-200 border-0",
    },
  };

  // 防御性处理：如果状态值不在配置中，使用默认配置
  const config = statusConfig[skill.status] || {
    label: skill.status || "未知",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-500 border-0",
  };

  // 根据模式设置不同的卡片样式
  const cardClassName =
    mode === "platform-skills"
      ? "group flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-dashed border-muted hover:border-primary/40 bg-card/50 hover:bg-card py-0 gap-0"
      : "group flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border hover:border-primary/20 bg-card py-0 gap-0";

  return (
    <Card className={cardClassName}>
      {/* Header: Logo + 名称 + 状态 */}
      <CardHeader className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <IconComponent className="h-5 w-5" />
            </div>
            {/* 名称 */}
            <div className="space-y-1 pt-0.5 min-w-0">
              <CardTitle className="text-base font-bold leading-tight truncate">
                {skill.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate max-w-[80px] inline-block rounded-full bg-muted px-1.5 py-0.5">
                  {skill.category}
                </span>
                <span className="shrink-0 h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="shrink-0">
                  {new Date(skill.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {/* 状态标签 */}
          <Badge
            variant={config.variant}
            className={`${config.className} mr-6`}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col">
        {/* 描述 */}
        <CardContent className="px-4 py-2 pb-0 flex-1">
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {skill.description}
          </CardDescription>
        </CardContent>

        {/* 信息区域: 移除了原来的 Grid 布局，整合到了 Header 或 Tag 区域，或者作为补充信息 */}
        {/* 如果有 Session ID 显示在这里 */}
        {mode === "my-skills" && skill.sessionId && (
          <CardContent className="px-4 py-2 pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
              <span className="font-medium shrink-0">关联会话</span>
              <span className="truncate opacity-75">{skill.sessionId}</span>
            </div>
          </CardContent>
        )}

        {/* Footer: 标签 + 操作按钮 */}
        <CardFooter className="flex items-center justify-between p-4 pt-3 mt-auto">
          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 mr-auto">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
              >
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="inline-flex items-center text-[10px] text-muted-foreground px-1">
                +{skill.tags.length - 3}
              </span>
            )}
          </div>

          {/* 操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onViewDetails?.(skill.skillId)}>
                查看详情
              </DropdownMenuItem>
              {mode === "my-skills" ? (
                can("uninstall", "Skill") && (
                  <DropdownMenuItem
                    onClick={() => onUninstall?.(skill.skillId)}
                    className="text-destructive focus:text-destructive"
                  >
                    卸载技能
                  </DropdownMenuItem>
                )
              ) : (
                <>
                  {can("update", "Skill") && (
                    <DropdownMenuItem
                      onClick={() =>
                        onToggleStatus?.(skill.skillId, skill.status)
                      }
                    >
                      {skill.status === SkillStatus.DISABLED
                        ? "启用技能"
                        : "禁用技能"}
                    </DropdownMenuItem>
                  )}
                  {can("delete", "Skill") && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(skill.skillId)}
                      className="text-destructive focus:text-destructive"
                    >
                      删除技能
                    </DropdownMenuItem>
                  )}
                  {can("install", "Skill") &&
                    skill.status !== SkillStatus.DISABLED && (
                      <DropdownMenuItem
                        onClick={() => onInstall?.(skill.skillId)}
                      >
                        装载技能
                      </DropdownMenuItem>
                    )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </div>
    </Card>
  );
}
