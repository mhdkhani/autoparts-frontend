import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader, type Column } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import type { AttributeSetListItem } from '@admin/lib/types';

const HREF = '/admin/catalog/attribute-sets';
export const metadata: Metadata = { title: navLabel(HREF) };

export default async function AttributeSetsPage() {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const { sets } = await adminGet<{ sets: AttributeSetListItem[] }>('/catalog/attribute-sets');

  const columns: Column<AttributeSetListItem>[] = [
    { key: 'id', title: 'شناسه', width: 80 },
    { key: 'name', title: 'نام مجموعه', link: (s) => `${HREF}/${s.id}` },
    { key: 'groupCount', title: 'گروه‌ها' },
    { key: 'attributeCount', title: 'ویژگی‌ها' },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        subtitle="هر نوع قطعه یک مجموعه دارد. فرم ثبت محصول و جدول مشخصات صفحه‌ی محصول از ویژگی‌های همین مجموعه ساخته می‌شود."
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن مجموعه‌ی جدید
          </Button>
        }
      />
      <Card flush>
        <DataTable columns={columns} rows={sets} rowKey={(s) => s.id} empty="مجموعه‌ای تعریف نشده است." />
      </Card>
    </>
  );
}
