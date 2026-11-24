import type { AdminUser } from '@admin/lib/types';
import { StatusBadge } from '../ui';

/** قفل / غیرفعال / فعال */
export default function UserStatusBadge({ user }: { user: AdminUser }) {
  if (user.lockedUntil) return <StatusBadge tone="danger">قفل</StatusBadge>;
  if (!user.isActive) return <StatusBadge tone="neutral">غیرفعال</StatusBadge>;
  return <StatusBadge tone="success">فعال</StatusBadge>;
}
