import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Forbidden from '@admin/components/Forbidden';
import CategoryForm from '@admin/components/catalog/CategoryForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { CategoriesResponse } from '@admin/lib/types';

export const metadata: Metadata = { title: 'ویرایش دسته' };

/** The form needs the whole tree anyway (parent dropdown), so the category is taken from the list. */
export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/catalog/categories');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const { categories, form } = await adminGet<CategoriesResponse>('/catalog/categories');
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <>
      <PageHeader title={`ویرایش دسته: ${String(category.values.name ?? '')}`} crumbs={page.subCrumbs} />
      <CategoryForm categories={categories} form={form} category={category} />
    </>
  );
}
