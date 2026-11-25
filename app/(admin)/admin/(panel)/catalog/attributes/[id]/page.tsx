import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AttributeForm from '@admin/components/catalog/AttributeForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { AttributeDetail } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش ویژگی' };

export default async function EditAttributePage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/catalog/attributes');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const { attribute, sets } = await adminGet<{ attribute: AttributeDetail; sets: { id: number; name: string }[] }>(
    `/catalog/attributes/${id}`,
  );

  return (
    <>
      <PageHeader title={`ویرایش ویژگی: ${attribute.labelFa}`} crumbs={page.subCrumbs} />
      <AttributeForm attribute={attribute} sets={sets} />
    </>
  );
}
