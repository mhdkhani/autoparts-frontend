import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import BrandForm from '@admin/components/catalog/BrandForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { Brand, Country } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش برند' };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/catalog/brands');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ brand }, { countries }] = await Promise.all([
    adminGet<{ brand: Brand }>(`/catalog/brands/${id}`),
    adminGet<{ countries: Country[] }>('/countries'),
  ]);

  return (
    <>
      <PageHeader title={`ویرایش برند: ${brand.nameFa}`} crumbs={page.subCrumbs} />
      <BrandForm countries={countries} brand={brand} />
    </>
  );
}
