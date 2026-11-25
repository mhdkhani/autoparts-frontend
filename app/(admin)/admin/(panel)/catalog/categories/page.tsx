import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader, StatusBadge, type Column } from '@admin/components/ui';
import ui from '@admin/components/ui/ui.module.css';
import css from '@admin/components/catalog/catalog.module.css';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import { categoryTree, type CategoriesResponse } from '@admin/lib/types';

const HREF = '/admin/catalog/categories';
export const metadata: Metadata = { title: navLabel(HREF) };

type Row = ReturnType<typeof categoryTree>[number];

/** The category tree as an indented table (parents first, children under them by position). */
export default async function CategoriesPage() {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const { categories } = await adminGet<CategoriesResponse>('/catalog/categories');
  const childCount = (id: number) => categories.filter((c) => c.parentId === id).length;

  const columns: Column<Row>[] = [
    {
      key: 'name',
      title: 'نام',
      link: (r) => `${HREF}/${r.category.id}`,
      render: (r) => (
        <span style={{ paddingInlineStart: `${r.depth * 1.5}rem` }}>
          {r.depth > 0 && <span className={ui.muted}>└ </span>}
          {String(r.category.values.name ?? '')}
        </span>
      ),
    },
    { key: 'url_key', title: 'کلید آدرس', ltr: true, render: (r) => String(r.category.values.url_key ?? '') },
    {
      key: 'image',
      title: 'تصویر',
      render: (r) =>
        r.category.values.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by nginx from the media volume
          <img src={String(r.category.values.image)} alt="" className={css.thumb} />
        ) : (
          <span className={ui.muted}>—</span>
        ),
    },
    {
      key: 'status',
      title: 'وضعیت',
      render: (r) =>
        r.category.values.is_active ? <StatusBadge tone="success">فعال</StatusBadge> : <StatusBadge>غیرفعال</StatusBadge>,
    },
    { key: 'children', title: 'زیرشاخه‌ها', render: (r) => childCount(r.category.id) || <span className={ui.muted}>—</span> },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <Button size="sm" href={`${HREF}/new?parent=${r.category.id}`}>
          + زیرشاخه
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        subtitle="درخت دسته‌های قطعات. فرم هر دسته سه تب دارد: عمومی، محتوا و سئو."
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن دسته‌ی اصلی
          </Button>
        }
      />
      <Card flush>
        <DataTable columns={columns} rows={categoryTree(categories)} rowKey={(r) => r.category.id} empty="دسته‌ای تعریف نشده است." />
      </Card>
    </>
  );
}
