import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import ConfigSideNav from '@admin/components/config/ConfigSideNav';
import ConfigSectionForm from '@admin/components/config/ConfigSectionForm';
import css from '@admin/components/config/config.module.css';
import ui from '@admin/components/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { can, getAdminSession } from '@admin/lib/auth';
import type { ConfigSection, ConfigSectionInfo, ConfigValues } from '@admin/lib/types';

export const metadata: Metadata = { title: 'تنظیمات سایت' };
export const dynamic = 'force-dynamic';

export default async function ConfigSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const session = await getAdminSession();
  if (!can(session, 'system.config')) return <Forbidden />;
  const key = (await params).section;
  const [{ sections }, { section, values }] = await Promise.all([
    adminGet<{ sections: ConfigSectionInfo[] }>('/config'),
    adminGet<{ section: ConfigSection; values: ConfigValues }>(`/config/${encodeURIComponent(key)}`),
  ]);

  return (
    <>
      <div className={ui.pageHead}>
        <h1>تنظیمات سایت</h1>
        <span className={ui.muted}>
          {section.category} › {section.label}
        </span>
      </div>
      <div className={css.layout}>
        <ConfigSideNav sections={sections} active={section.key} />
        <div className={css.body}>
          {/* key: a fresh form (and fresh values) for every section */}
          <ConfigSectionForm key={section.key} section={section} initial={values} />
        </div>
      </div>
    </>
  );
}
