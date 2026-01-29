import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'

export function AuthDebugPage() {
  const { auth } = useAuthStore()
  const navigate = useNavigate()

  const isTokenExpired = auth.accessTokenExpiresAt && auth.accessTokenExpiresAt < Date.now()
  const tokenExpiresIn = auth.accessTokenExpiresAt
    ? Math.floor((auth.accessTokenExpiresAt - Date.now()) / 1000)
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>认证状态诊断</CardTitle>
          <CardDescription>
            检查当前登录状态和 Token 信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token 状态 */}
          <div>
            <h3 className="font-semibold mb-2">Token 状态</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">是否有 Token:</span>
                <Badge variant={auth.accessToken ? 'default' : 'destructive'}>
                  {auth.accessToken ? '是' : '否'}
                </Badge>
              </div>

              {auth.accessToken && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Token 是否过期:</span>
                    <Badge variant={isTokenExpired ? 'destructive' : 'default'}>
                      {isTokenExpired ? '已过期' : '有效'}
                    </Badge>
                  </div>

                  {!isTokenExpired && tokenExpiresIn > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">剩余有效时间:</span>
                      <span className="text-sm font-mono">
                        {Math.floor(tokenExpiresIn / 60)} 分 {tokenExpiresIn % 60} 秒
                      </span>
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Token 预览:</span>
                    <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                      {auth.accessToken.substring(0, 50)}...
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 用户信息 */}
          <div>
            <h3 className="font-semibold mb-2">用户信息</h3>
            {auth.user ? (
              <div className="space-y-1 text-sm">
                <div>用户名: {auth.user.username}</div>
                <div>邮箱: {auth.user.email}</div>
                <div>账号: {auth.user.accountNo}</div>
                <div>角色: {auth.user.roles.join(', ')}</div>
                <div>权限数: {auth.user.permissions.length}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">未登录</p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            {!auth.accessToken || isTokenExpired ? (
              <Button onClick={() => navigate({ to: '/sign-in' })}>
                去登录
              </Button>
            ) : (
              <Button onClick={() => navigate({ to: '/settings/roles' })}>
                访问角色管理
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                auth.reset()
                window.location.reload()
              }}
            >
              清除认证信息
            </Button>
          </div>

          {/* 诊断建议 */}
          {(!auth.accessToken || isTokenExpired) && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ 诊断结果
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {!auth.accessToken
                  ? '未检测到有效的 Access Token，请先登录。'
                  : 'Access Token 已过期，请重新登录。'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
