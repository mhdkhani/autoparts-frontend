import type { Metadata } from 'next';
import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader, readTableState, sortAndPage, type Column, type SearchParams } from '@admin/components/ui';
import ui from '@admin/components/ui/ui.module.css';
import css from '@admin/components/catalog/catalog.module.css';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { navLabel } from '@admin/lib/nav';
import type { BrandListItem, Country } from '@admin/lib/types';

const HREF = '/admin/catalog/brands';
export const metadata: Metadata = { title: navLabel(HREF) };

/** Part brands; search covers every name (Persian, English, aliases) and the URL key. */
export default async function BrandsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const page = await adminPage(HREF);
  if (!page) return <Forbidden />;
  const params = await searchParams;
  const [{ brands }, { countries }] = await Promise.all([
    adminGet<{ brands: BrandListItem[] }>('/catalog/brands'),
    adminGet<{ countries: Country[] }>('/countries'),
  ]);
  const countryName = new Map(countries.map((c) => [c.code, c.nameFa]));
  const country = (b: BrandListItem) => (b.originCountryCode ? (countryName.get(b.originCountryCode) ?? '') : '');

  const sort = {
    id: (b: BrandListItem) => b.id,
    nameFa: (b: BrandListItem) => b.nameFa,
    nameEn: (b: BrandListItem) => b.nameEn ?? '',
    country,
  };
  const state = readTableState(params, { sortable: Object.keys(sort), sort: 'nameFa' });
  const { rows, total } = sortAndPage(brands, state, sort, (b) => [b.nameFa, b.nameEn, b.urlKey, ...b.aliases]);
  const none = <span className={ui.muted}>—</span>;

  const columns: Column<BrandListItem>[] = [
    {
      key: 'logo',
      title: 'لوگو',
      width: 72,
      render: (b) =>
        b.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by nginx from the media volume
          <img src={b.logo} alt="" className={css.thumb} />
        ) : (
          none
        ),
    },
    { key: 'nameFa', title: 'نام', sortable: true, link: (b) => `${HREF}/${b.id}` },
    { key: 'nameEn', title: 'نام انگلیسی', sortable: true, ltr: true, render: (b) => b.nameEn ?? none },
    { key: 'country', title: 'کشور مبدأ', sortable: true, render: (b) => country(b) || none },
    { key: 'aliases', title: 'نام‌های دیگر', wrap: true, render: (b) => b.aliases.join('، ') || none },
    { key: 'urlKey', title: 'آدرس', ltr: true },
  ];

  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        subtitle="برندهای سازنده‌ی قطعه (Bosch، Brembo، RIDEX …)، جدا از برندهای خودرو. هر محصول به یک برند وصل می‌شود."
        actions={
          <Button href={`${HREF}/new`} variant="primary">
            + افزودن برند
          </Button>
        }
      />
      <Card flush>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(b) => b.id}
          empty="برندی تعریف نشده است."
          state={state}
          total={total}
          params={params}
          search="جستجو در نام‌ها یا آدرس برند…"
        />
      </Card>
    </>
  );
}
