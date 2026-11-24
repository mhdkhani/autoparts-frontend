import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, EmptyState, PageHeader } from '@admin/components/ui';
import { getAdminSession } from '@admin/lib/auth';
import { hasAccess, navCrumbs, navItem } from '@admin/lib/nav';

// Any /admin/* URL without a page of its own lands here:
//  - a menu item marked `soon` (lib/nav.ts), for admins its acl allows → «در حال ساخت»
//  - anything else → the admin module's own 404, inside the admin theme.
// A real page for a path always wins over this catch-all.

type Props = { params: Promise<{ missing: string[] }> };

// menu hrefs are plain ASCII, so the raw segments are compared as they are
async function soonItem(params: Props['params']) {
  const hit = navItem('/admin/' + (await params).missing.join('/'));
  return hit?.item.soon ? hit : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hit = await soonItem(params);
  return hit ? { title: hit.item.label } : {};
}

export default async function AdminCatchAll({ params }: Props) {
  const hit = await soonItem(params);
  if (!hit || !hasAccess(hit.item.acl, await getAdminSession())) notFound();
  return (
    <>
      <PageHeader title={hit.item.label} crumbs={navCrumbs(hit)} />
      <Card flush>
        <EmptyState icon="building" title="این بخش در حال ساخت است." text="به‌زودی از همین‌جا قابل استفاده خواهد بود." />
      </Card>
    </>
  );
}
