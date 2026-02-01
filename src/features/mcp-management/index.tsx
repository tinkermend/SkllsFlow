import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, HelpCircle } from "lucide-react";
import { MyMcpsList } from "./components/my-mcps/my-mcps-list";
import { MarketplaceLayout } from "./components/marketplace/marketplace-layout";
import { CreateMcpDialog } from "./components/dialogs/create-mcp-dialog";
import { LoadMcpDialog } from "./components/dialogs/load-mcp-dialog";
import { useDeleteService } from "./hooks/use-mcp-services";
import { useHealthCheck, useRestartService } from "./hooks/use-mcp-operations";
import type { McpService, McpMarketplaceItem } from "./types";

/**
 * MCP 管理中心主页面
 */
export default function McpManagement() {
  const [activeTab, setActiveTab] = useState("my-mcps");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [selectedMcp, setSelectedMcp] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useDeleteService();
  const restartMutation = useRestartService();
  const healthCheckMutation = useHealthCheck();

  // 处理配置 MCP
  const handleConfigure = (service: McpService) => {
    // TODO: 打开配置对话框
    console.log("Configure:", service);
  };

  // 处理重启 MCP
  const handleRestart = async (service: McpService) => {
    await restartMutation.mutateAsync(service.mcpId);
  };

  // 处理添加到会话
  const handleAddToSession = (service: McpService) => {
    setSelectedMcp({ id: service.mcpId, name: service.name });
    setLoadDialogOpen(true);
  };

  // 处理删除 MCP
  const handleDelete = async (service: McpService) => {
    if (confirm(`确定要删除 ${service.name} 吗？`)) {
      await deleteMutation.mutateAsync(service.mcpId);
    }
  };

  // 处理装载市场 MCP
  const handleLoadMarketplace = (item: McpMarketplaceItem) => {
    setSelectedMcp({ id: item.mcpId, name: item.name });
    setLoadDialogOpen(true);
  };

  return (
    <>
      {/* Header - 顶部导航栏 */}
      <Header>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main - 主内容区域 */}
      <Main>
        <div className="space-y-6">
          {/* 页面标题和操作栏 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">MCP 管理中心</h1>
              <p className="text-muted-foreground mt-1">
                管理和配置 Model Context Protocol 服务
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建/导入 MCP
              </Button>
            </div>
          </div>

          {/* 标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="my-mcps">我的 MCP</TabsTrigger>
              <TabsTrigger value="marketplace">MCP 市场</TabsTrigger>
            </TabsList>

            <TabsContent value="my-mcps" className="mt-6">
              <MyMcpsList
                onGoToMarketplace={() => setActiveTab("marketplace")}
                onConfigure={handleConfigure}
                onRestart={handleRestart}
                onAddToSession={handleAddToSession}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <MarketplaceLayout onLoad={handleLoadMarketplace} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>

      {/* 对话框 */}
      <CreateMcpDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      {selectedMcp && (
        <LoadMcpDialog
          open={loadDialogOpen}
          onOpenChange={setLoadDialogOpen}
          mcpId={selectedMcp.id}
          mcpName={selectedMcp.name}
        />
      )}
    </>
  );
}
