import Forbidden from '@admin/components/Forbidden';
import ProductForm from '@admin/components/catalog/ProductForm';
import { Button, Field, PageHeader, Select } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { ProductFormDefinition, ProductChoices } from '@admin/lib/types';

export default async function NewProduct({ searchParams }: { searchParams: Promise<{set?: string}> }) {
  const page = await adminPage('/admin/catalog/products');
  if (!page) return <Forbidden />;
  const choices = await adminGet<ProductChoices>('/catalog/products/choices');
  const { set } = await searchParams;
  const eav = set ? await adminGet<ProductFormDefinition>(`/catalog/products/sets/${idParam(set)}`) : null;
  return <><PageHeader title="افزودن محصول ساده" crumbs={page.subCrumbs} />
    {eav ? <ProductForm key={eav.setId} choices={choices} eav={eav} /> : <form>
      <Field label="مجموعه ویژگی" htmlFor="set"><Select id="set" name="set" required defaultValue="">
        <option value="">— انتخاب کنید —</option>{choices.sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select></Field><Button type="submit" variant="primary">باز کردن فرم محصول</Button>
    </form>}</>;
}
