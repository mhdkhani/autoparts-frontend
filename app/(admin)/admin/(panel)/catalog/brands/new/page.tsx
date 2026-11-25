import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import BrandForm from '@admin/components/catalog/BrandForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { Country } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن برند' };

export default async function NewBrandPage() {
  const page = await adminPage('/admin/catalog/brands');
  if (!page) return <Forbidden />;
  const { countries } = await adminGet<{ countries: Country[] }>('/countries');

  return (
    <>
      <PageHeader title="افزودن برند قطعه" crumbs={page.subCrumbs} />
      <BrandForm countries={countries} />
    </>
  );
}
