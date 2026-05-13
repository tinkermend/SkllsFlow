import { MoreVertical, Package } from "lucide-react";
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
import { ParsedIcon } from "@/components/parsed-icon";
import { SkillStatus, type Skill } from "../types";

const MAX_VISIBLE_TAGS = 5;

interface SkillCardProps {
  skill: Skill;
  mode?: "my-skills" | "platform-skills"; // 新增：区分我的技能和平台技能
  onViewDetails?: (skillId: string) => void;
  onUninstall?: (skillId: string) => void;
  onDelete?: (skillId: string) => void; // 新增：删除技能（平台技能）
  onInstall?: (skillId: string) => void; // 新增：装载技能（平台技能）
}

export function SkillCard({
  skill,
  mode = "my-skills",
  onViewDetails,
  onUninstall,
  onDelete,
  onInstall,
}: SkillCardProps) {
  const { can } = usePermission();
  const visibleTags = skill.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = Math.max(skill.tags.length - visibleTags.length, 0);

  const statusConfig = {
    [SkillStatus.ACTIVE]: {
      label: "可用",
      variant: "default" as const,
      className:
        "bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0",
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
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ParsedIcon
              name={skill.icon}
              fallback={Package}
              className="h-5 w-5"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1 pt-0.5">
            <div className="flex items-start gap-2">
              <CardTitle className="min-w-0 flex-1 text-base font-bold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {skill.name}
              </CardTitle>
              <Badge
                variant={config.variant}
                className={`${config.className} shrink-0`}
              >
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[108px] inline-block rounded-full bg-muted px-1.5 py-0.5">
                {skill.skillId}
              </span>
              <span className="shrink-0 h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="shrink-0">
                {new Date(skill.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col">
        {/* 描述 */}
        <CardContent className="px-4 py-2 pb-0 flex-1">
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {skill.description}
          </CardDescription>
        </CardContent>

        {skill.tags.length > 0 && (
          <CardContent className="px-4 py-2 pb-0">
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="max-w-[120px] truncate px-2 py-0 text-[11px] font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {hiddenTagCount > 0 && (
                <Badge
                  variant="outline"
                  className="px-2 py-0 text-[11px] font-normal text-muted-foreground"
                >
                  +{hiddenTagCount}
                </Badge>
              )}
            </div>
          </CardContent>
        )}

        {/* 如果有 Session ID 显示在这里 */}
        {mode === "my-skills" && skill.sessionId && (
          <CardContent className="px-4 py-2 pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
              <span className="font-medium shrink-0">关联会话</span>
              <span className="truncate opacity-75">{skill.sessionId}</span>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex items-center justify-end p-4 pt-3 mt-auto">
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
                  {can("delete", "Skill") && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(skill.skillId)}
                      className="text-destructive focus:text-destructive"
                    >
                      删除技能
                    </DropdownMenuItem>
                  )}
                  {can("install", "Skill") && (
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
