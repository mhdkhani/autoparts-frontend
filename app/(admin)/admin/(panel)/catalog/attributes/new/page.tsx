import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import AttributeForm from '@admin/components/catalog/AttributeForm';
import { PageHeader } from '@admin/components/ui';
import { adminPage } from '@admin/lib/auth';

export const metadata: Metadata = { title: 'افزودن ویژگی' };

export default async function NewAttributePage() {
  const page = await adminPage('/admin/catalog/attributes');
  if (!page) return <Forbidden />;

  return (
    <>
      <PageHeader title="افزودن ویژگی جدید" crumbs={page.subCrumbs} />
      <AttributeForm />
    </>
  );
}
