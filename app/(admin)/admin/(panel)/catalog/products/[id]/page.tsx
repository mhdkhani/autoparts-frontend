import Forbidden from '@admin/components/Forbidden';
import ProductForm from '@admin/components/catalog/ProductForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { ProductFormDefinition, ProductChoices, SimpleProduct } from '@admin/lib/types';

export default async function EditProduct({ params }: { params: Promise<{id: string}> }) {
  const page = await adminPage('/admin/catalog/products');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ product, form }, choices] = await Promise.all([
    adminGet<{product: SimpleProduct; form: ProductFormDefinition}>(`/catalog/products/${id}`),
    adminGet<ProductChoices>('/catalog/products/choices'),
  ]);
  return <><PageHeader title={`ویرایش محصول · ${product.sku}`} crumbs={page.subCrumbs} />
    <ProductForm product={product} choices={choices} eav={form} /></>;
}
