import { redirect } from 'next/navigation';
import Forbidden from '@admin/components/Forbidden';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { ConfigSectionInfo } from '@admin/lib/types';

export const dynamic = 'force-dynamic';

/** /admin/system/config → the first settings section. */
export default async function ConfigIndexPage() {
  const session = await getAdminSession();
  if (!can(session, 'system.config')) return <Forbidden />;
  const { sections } = await adminGet<{ sections: ConfigSectionInfo[] }>('/config');
  redirect(`/admin/system/config/${sections[0].key}`);
}
