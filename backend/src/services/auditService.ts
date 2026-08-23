import AuditLog from '../models/AuditLog';

export const logAudit = async (
  userId: any,
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export',
  entityType: string,
  entityId: any,
  description: string,
  previousValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      previousValue,
      newValue,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
