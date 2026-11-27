import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';

const LIST = '/admin/catalog/products';
export default async function ProductsPage() {
  const page = await adminPage(LIST);
  if (!page) return <Forbidden />;
  const rows = await adminGet<{id: number; sku: string; title: string | null; brand: string; set: string}[]>('/catalog/products');
  return <><PageHeader title={page.title} crumbs={page.crumbs} actions={<Button href={LIST + '/new'} variant="primary">+ افزودن محصول</Button>} />
    <Card flush><DataTable rows={rows} rowKey={r => r.id} empty="محصولی ثبت نشده است." columns={[
      {key:'sku', title:'شناسه فروش', ltr:true, link:r => LIST + '/' + r.id},
      {key:'title', title:'عنوان محصول'}, {key:'brand', title:'برند'}, {key:'set', title:'مجموعه ویژگی'},
    ]} /></Card></>;
}
