import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import CategoryForm from '@admin/components/catalog/CategoryForm';
import { PageHeader, type SearchParams } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { CategoriesResponse } from '@admin/lib/types';

export const metadata: Metadata = { title: 'افزودن دسته' };

/** ?parent=<id> («+ زیرشاخه» in the list) preselects the parent. */
export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const page = await adminPage('/admin/catalog/categories');
  if (!page) return <Forbidden />;
  const { parent: parentParam } = await searchParams;
  const { categories, form } = await adminGet<CategoriesResponse>('/catalog/categories');
  const parent = categories.find((c) => String(c.id) === parentParam);

  return (
    <>
      <PageHeader
        title={parent ? `افزودن زیرشاخه به «${String(parent.values.name ?? '')}»` : 'افزودن دسته‌ی جدید'}
        crumbs={page.subCrumbs}
      />
      <CategoryForm categories={categories} form={form} defaultParentId={parent?.id} />
    </>
  );
}
