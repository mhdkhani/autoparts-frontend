import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import {
  Button,
  Card,
  DataTable,
  PageHeader,
  readTableState,
  sortAndPage,
  StatusBadge,
  type Column,
  type SearchParams,
} from '@admin/components/ui';
import css from '@admin/components/ui/ui.module.css';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import { attributeTypeLabel, OPTION_TYPES, type AttributeListItem } from '@admin/lib/types';

const HREF = '/admin/catalog/attributes';
export const metadata: Metadata = { title: navLabel(HREF) };

const SORT = {
  id: (a: AttributeListItem) => a.id,
  labelFa: (a: AttributeListItem) => a.labelFa,
  code: (a: AttributeListItem) => a.code,
  dataType: (a: AttributeListItem) => attributeTypeLabel(a.dataType),
  setCount: (a: AttributeListItem) => a.setCount,
};

export default async function AttributesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const params = await searchParams;
  const { attributes } = await adminGet<{ attributes: AttributeListItem[] }>('/catalog/attributes');
  const state = readTableState(params, { sortable: Object.keys(SORT), sort: 'labelFa' });
  // search box: Persian / English title and code
  const { rows, total } = sortAndPage(attributes, state, SORT, (a) => [a.labelFa, a.labelEn, a.code]);

  const columns: Column<AttributeListItem>[] = [
    { key: 'id', title: 'شناسه', sortable: true, width: 80 },
    { key: 'labelFa', title: 'عنوان', sortable: true, link: (a) => `${HREF}/${a.id}` },
    { key: 'code', title: 'کد', sortable: true, ltr: true },
    {
      key: 'dataType',
      title: 'نوع',
      sortable: true,
      render: (a) => (
        <>
          {attributeTypeLabel(a.dataType)}
          {a.unit && <span className={css.muted}> ({a.unit})</span>}
          {OPTION_TYPES.includes(a.dataType) && <span className={css.muted}> · {a.optionCount} گزینه</span>}
        </>
      ),
    },
    {
      key: 'usage',
      title: 'کاربرد',
      wrap: true,
      render: (a) => (
        <>
          {a.isFilterable && <StatusBadge tone="info">فیلتر</StatusBadge>} {a.isSearchable && <StatusBadge>جستجو</StatusBadge>}
        </>
      ),
    },
    {
      key: 'setCount',
      title: 'مجموعه‌ها',
      sortable: true,
      render: (a) => (a.setCount ? a.setCount : <span className={css.muted}>—</span>),
    },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        subtitle="ویژگی‌های فنی محصولات (ضخامت، ولتاژ، گرانروی …). هر ویژگی در یک یا چند «مجموعه‌ی ویژگی» قرار می‌گیرد."
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن ویژگی جدید
          </Button>
        }
      />
      <Card flush>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(a) => a.id}
          empty="ویژگی‌ای تعریف نشده است."
          state={state}
          total={total}
          params={params}
          search="جستجو در عنوان یا کد ویژگی…"
        />
      </Card>
    </>
  );
}
