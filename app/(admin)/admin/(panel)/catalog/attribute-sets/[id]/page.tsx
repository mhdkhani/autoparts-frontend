import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AttributeSetForm from '@admin/components/catalog/AttributeSetForm';
import { Button, PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage, can } from '@admin/lib/auth';
import type { AttributeListItem, AttributeSet } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش مجموعه‌ی ویژگی' };

export default async function EditAttributeSetPage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/catalog/attribute-sets');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ set }, { attributes }] = await Promise.all([
    adminGet<{ set: AttributeSet }>(`/catalog/attribute-sets/${id}`),
    adminGet<{ attributes: AttributeListItem[] }>('/catalog/attributes'),
  ]);

  return (
    <>
      <PageHeader
        title={`ویرایش مجموعه: ${set.name}`}
        crumbs={page.subCrumbs}
        actions={<Button href={`/admin/catalog/attribute-sets/new?from=${set.id}`}>کپی از این مجموعه</Button>}
      />
      <AttributeSetForm attributes={attributes} set={set} canManageAttributes={can(page.session, 'catalog.attributes')} />
    </>
  );
}
