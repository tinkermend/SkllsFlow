import { DatabaseService } from './database.service.js';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'refresh'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'role.assign'
  | 'permission.assign';

class AuditLogService {
  private prisma = DatabaseService.getInstance();

  async record(params: {
    userId?: bigint;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource || 'system',
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

export const auditLogService = new AuditLogService();
