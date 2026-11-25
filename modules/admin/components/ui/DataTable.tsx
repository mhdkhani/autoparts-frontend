import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button, cx, EmptyState, Icon } from './base';
import { Input } from './form';
import css from './ui.module.css';

// List-page table (server component). Search, sort and page live in the URL (?q=…&sort=name&dir=desc&page=2):
// they survive reloads and shared links, and server pages read them from `searchParams`.
//
//   const state = readTableState(await searchParams, { sortable: Object.keys(SORT), sort: 'id' });
//   const { rows, total } = sortAndPage(list, state, SORT, (r) => [r.name, r.code]);  // or rows + total from a paged API
//   <DataTable columns={...} rows={rows} rowKey={...} state={state} total={total} params={params} search="جستجو…" />

export type SortDir = 'asc' | 'desc';
/** `q` = search text ('' = no search) */
export type TableState = { page: number; pageSize: number; sort?: string; dir: SortDir; q: string };
export type SearchParams = Record<string, string | string[] | undefined>;

export type Column<T> = {
  key: string;
  title: ReactNode;
  /** cell content; default = row[key] */
  render?: (row: T) => ReactNode;
  /** the cell links here (row title → its edit page) */
  link?: (row: T) => string;
  /** the header becomes a sort link (?sort=<key>) */
  sortable?: boolean;
  /** left-to-right cell (usernames, emails, codes) */
  ltr?: boolean;
  /** let long text wrap instead of keeping one line */
  wrap?: boolean;
  width?: number | string;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const fa = (n: number) => n.toLocaleString('fa-IR');

/** Reads page / sort / dir / q from the URL; `sortable` lists the allowed sort keys (anything else is ignored). */
export function readTableState(
  params: SearchParams,
  opts: { pageSize?: number; sortable?: string[]; sort?: string; dir?: SortDir } = {},
): TableState {
  const page = Number(one(params.page));
  const sort = one(params.sort);
  const dir = one(params.dir);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: opts.pageSize ?? 20,
    sort: sort && opts.sortable?.includes(sort) ? sort : opts.sort,
    dir: dir === 'asc' || dir === 'desc' ? dir : (opts.dir ?? 'asc'),
    q: (one(params.q) ?? '').trim(),
  };
}

type SortValue = string | number | null | undefined;

/**
 * Searches, sorts and slices a full list in memory — for API endpoints that return everything at once.
 * `searchIn` gives the texts of a row that `state.q` is matched against (every word of q must appear in one
 * of them); without it the search box has no effect. When an endpoint gets server-side paging / search,
 * pass its rows and total to DataTable instead.
 */
export function sortAndPage<T>(
  rows: T[],
  state: TableState,
  sortBy: Record<string, (row: T) => SortValue>,
  searchIn?: (row: T) => (string | null | undefined)[],
): { rows: T[]; total: number } {
  const words = normalizeSearch(state.q).split(' ').filter(Boolean);
  const found =
    searchIn && words.length
      ? rows.filter((row) => {
          const text = normalizeSearch(searchIn(row).filter(Boolean).join(' '));
          return words.every((w) => text.includes(w));
        })
      : rows;
  const get = state.sort ? sortBy[state.sort] : undefined;
  const sorted = get ? [...found].sort((a, b) => compare(get(a), get(b)) * (state.dir === 'desc' ? -1 : 1)) : found;
  const start = (clampPage(state.page, state.pageSize, found.length) - 1) * state.pageSize;
  return { rows: sorted.slice(start, start + state.pageSize), total: found.length };
}

/**
 * Text as compared by the search: lower-case, Arabic «ي / ك» typed on some keyboards → Persian «ی / ک»,
 * half-space (ZWNJ) and runs of spaces → one space. So «نيمه‌سنتتيک» finds «نیمه سنتتیک».
 */
function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s]+/g, ' ').trim();
}

/** a page past the end (old link, rows deleted) → the last page */
const clampPage = (page: number, pageSize: number, total: number) =>
  Math.min(page, Math.max(1, Math.ceil(total / pageSize)));

function compare(a: SortValue, b: SortValue): number {
  if (a == null || a === '') return b == null || b === '' ? 0 : 1; // empty values last
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'fa', { numeric: true });
}

/** "?a=1&page=2" from the current params with some keys changed (undefined removes a key). */
export function queryHref(params: SearchParams, patch: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const value = one(v);
    if (value !== undefined && !(k in patch)) q.set(k, value);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '?';
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'موردی وجود ندارد.',
  state,
  total,
  params = {},
  search,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: ReactNode;
  /** sort / page state (omit for a plain table) */
  state?: TableState;
  /** number of rows across all pages (shows pagination) */
  total?: number;
  params?: SearchParams;
  /** placeholder of a search box above the table (needs `state`; filter the rows with sortAndPage's `searchIn`) */
  search?: string;
}) {
  return (
    <>
      {search && state && <SearchBox placeholder={search} state={state} params={params} />}
      <div className={css.tableWrap}>
        <table className={css.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined} aria-sort={ariaSort(c, state)}>
                  {c.sortable && state ? <SortLink column={c} state={state} params={params} /> : c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => {
                  const content = c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '');
                  return (
                    <td key={c.key} dir={c.ltr ? 'ltr' : undefined} className={c.wrap ? css.wrap : undefined}>
                      {c.link ? (
                        <Link href={c.link(row)} className={css.rowLink}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState
          icon={state?.q ? 'search' : 'empty'}
          title={state?.q ? `نتیجه‌ای برای «${state.q}» پیدا نشد.` : empty}
        />
      )}
      {state && total !== undefined && (
        <Pagination page={state.page} pageSize={state.pageSize} total={total} params={params} />
      )}
    </>
  );
}

/**
 * Search box above a table: a plain GET form (works without JavaScript). Submitting keeps the current sort,
 * drops the page (results start at page 1), and «پاک کردن» removes the search.
 */
function SearchBox({ placeholder, state, params }: { placeholder: string; state: TableState; params: SearchParams }) {
  const keep = Object.entries(params).flatMap(([k, v]) => {
    const value = one(v);
    return k === 'q' || k === 'page' || value === undefined ? [] : [[k, value] as const];
  });
  return (
    <form role="search" className={css.tableSearch}>
      {keep.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Input type="search" name="q" defaultValue={state.q} placeholder={placeholder} aria-label={placeholder} />
      <Button type="submit" icon={<Icon name="search" size={16} />}>
        جستجو
      </Button>
      {state.q && (
        <Link href={queryHref(params, { q: undefined, page: undefined })} className={css.tableSearchClear}>
          پاک کردن
        </Link>
      )}
    </form>
  );
}

function SortLink<T>({ column, state, params }: { column: Column<T>; state: TableState; params: SearchParams }) {
  const active = state.sort === column.key;
  const next = active && state.dir === 'asc' ? 'desc' : 'asc';
  return (
    <Link
      href={queryHref(params, { sort: column.key, dir: next, page: undefined })}
      className={cx(css.sortLink, active && css.sortActive)}
      scroll={false}
    >
      {column.title}
      <span className={css.sortIcon} aria-hidden>
        {active ? (state.dir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </Link>
  );
}

function ariaSort<T>(c: Column<T>, state?: TableState) {
  if (!c.sortable || !state || state.sort !== c.key) return undefined;
  return state.dir === 'asc' ? 'ascending' : 'descending';
}

/** Page links under a table, kept in the URL (?page=). Hidden when everything fits on one page. */
export function Pagination({
  page,
  pageSize,
  total,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** the page's current search params (other filters are kept in the links) */
  params: SearchParams;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;
  const current = clampPage(page, pageSize, total);
  const href = (p: number) => queryHref(params, { page: p === 1 ? undefined : p });
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <nav className={css.pager} aria-label="صفحه‌بندی">
      <span className={css.muted}>
        {fa(from)} تا {fa(to)} از {fa(total)}
      </span>
      <div className={css.pages}>
        <Link href={href(current - 1)} className={cx(css.pageLink, current === 1 && css.pageDisabled)}>
          قبلی
        </Link>
        {pageList(current, pageCount).map((p, i) =>
          p === null ? (
            <span key={`gap${i}`} className={css.pageGap}>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={cx(css.pageLink, p === current && css.pageCurrent)}
              aria-current={p === current ? 'page' : undefined}
            >
              {fa(p)}
            </Link>
          ),
        )}
        <Link href={href(current + 1)} className={cx(css.pageLink, current === pageCount && css.pageDisabled)}>
          بعدی
        </Link>
      </div>
    </nav>
  );
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, count: number): (number | null)[] {
  const pages = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}
