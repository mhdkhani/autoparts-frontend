import type { AdminUser } from '@admin/lib/types';
import ui from '../ui.module.css';

/** قفل / غیرفعال / فعال */
export default function UserStatusBadge({ user }: { user: AdminUser }) {
  if (user.lockedUntil) return <span className={`${ui.badge} ${ui.locked}`}>قفل</span>;
  if (!user.isActive) return <span className={`${ui.badge} ${ui.off}`}>غیرفعال</span>;
  return <span className={`${ui.badge} ${ui.ok}`}>فعال</span>;
}
