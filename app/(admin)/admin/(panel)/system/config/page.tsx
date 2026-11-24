import { redirect } from 'next/navigation';
import Forbidden from '@admin/components/Forbidden';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { ConfigSectionInfo } from '@admin/lib/types';

/** /admin/system/config → the first settings section. */
export default async function ConfigIndexPage() {
  if (!(await adminPage('/admin/system/config'))) return <Forbidden />;
  const { sections } = await adminGet<{ sections: ConfigSectionInfo[] }>('/config');
  redirect(`/admin/system/config/${sections[0].key}`);
}
