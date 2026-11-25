import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AttributeSetForm from '@admin/components/catalog/AttributeSetForm';
import { PageHeader, type SearchParams } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage, can } from '@admin/lib/auth';
import type { AttributeListItem, AttributeSet } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن مجموعه‌ی ویژگی' };

/** ?from=<id> starts from a copy of that set («کپی از این مجموعه» on the edit page). */
export default async function NewAttributeSetPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const page = await adminPage('/admin/catalog/attribute-sets');
  if (!page) return <Forbidden />;
  const from = (await searchParams).from;
  const [{ attributes }, copy] = await Promise.all([
    adminGet<{ attributes: AttributeListItem[] }>('/catalog/attributes'),
    typeof from === 'string' ? adminGet<{ set: AttributeSet }>(`/catalog/attribute-sets/${idParam(from)}`) : undefined,
  ]);

  return (
    <>
      <PageHeader
        title={copy ? `مجموعه‌ی جدید بر پایه‌ی «${copy.set.name}»` : 'افزودن مجموعه‌ی جدید'}
        crumbs={page.subCrumbs}
      />
      <AttributeSetForm
        attributes={attributes}
        copyFrom={copy?.set}
        canManageAttributes={can(page.session, 'catalog.attributes')}
      />
    </>
  );
}
