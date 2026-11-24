import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import ConfigSideNav from '@admin/components/config/ConfigSideNav';
import ConfigSectionForm from '@admin/components/config/ConfigSectionForm';
import css from '@admin/components/config/config.module.css';
import { PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import type { ConfigSection, ConfigSectionInfo, ConfigValues } from '@admin/lib/types';

const HREF = '/admin/system/config';
export const metadata: Metadata = { title: navLabel(HREF) };

export default async function ConfigSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const key = (await params).section;
  const [{ sections }, { section, values }] = await Promise.all([
    adminGet<{ sections: ConfigSectionInfo[] }>('/config'),
    adminGet<{ section: ConfigSection; values: ConfigValues }>(`/config/${encodeURIComponent(key)}`),
  ]);

  return (
    <>
      <PageHeader title={page.title} crumbs={page.crumbs} subtitle={`${section.category} › ${section.label}`} />
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
