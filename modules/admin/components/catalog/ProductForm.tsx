'use client';

import { useState, type FormEvent } from 'react';
import { useAdminForm } from '@admin/lib/client-api';
import { categoryTree, type ProductFormDefinition, type ProductChoices, type SimpleProduct } from '@admin/lib/types';
import { Button, Checkbox, Fieldset, Field, FieldTabs, Form, FormActions, FormError, Input, Select, useFieldTabs } from '../ui';
import FluidStandards, { useFluidStandards } from './FluidStandards';
import ProductFitments, { useFitments } from './ProductFitments';
import ProductNumbers, { useProductNumbers } from './ProductNumbers';
import { formValue, tabsOf } from './eav-form';

const LIST = '/admin/catalog/products';

export default function ProductForm({ choices, eav, product }: {
  choices: ProductChoices; eav: ProductFormDefinition; product?: SimpleProduct;
}) {
  const form = useAdminForm(LIST);
  const numberForm = useProductNumbers(product?.partNumbers);
  const fluids=useFluidStandards(product?.fluidClaims);
  const fitments = useFitments(product?.fitments);
  const [selectedBrand, setSelectedBrand] = useState(product?.brandId ?? 0);
  const tabs = tabsOf(eav);
  const tab = useFieldTabs(tabs, form.setError);
  const fields = eav.groups.flatMap(g => g.fields);
  const [values, setValues] = useState<Record<string,string>>(() => Object.fromEntries(fields.map(f =>
    [f.code, product ? formValue(f, product.values[f.code]) : f.defaultValue ?? ''])));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const sku = String(data.get('sku') ?? '').trim();
    const brandId = Number(data.get('brand'));
    const categoryIds = data.getAll('category').map(Number);
    if (!sku || !brandId || !categoryIds.length) {
      form.setError('شناسه فروش، برند و حداقل یک دسته را وارد کنید.');
      return;
    }
    if (eav.countryRequired && !data.get('country')) {
      form.setError('کشور تولید را وارد کنید.');
      return;
    }
    if (!tab.checkRequired(values)) return;
    const body = { fluidClaims:fluids.payload, fitments: fitments.payload, partNumbers: numberForm.payload(), sku, brandId, categoryIds, countryCode: data.get('country') || null, setId: eav.setId,
      values: Object.fromEntries(fields.map(f => [f.code, f.dataType === 'multiselect'
        ? (values[f.code] ? values[f.code].split('\n') : []) : values[f.code]])) };
    await form.send(product ? 'PUT' : 'POST', product ? `/catalog/products/${product.id}` : '/catalog/products', body, 'محصول ذخیره شد.');
  }
  return <Form onSubmit={submit}>
    <FormError>{form.error}</FormError>
    <p>مجموعه ویژگی · {choices.sets.find(s => s.id === eav.setId)?.name}</p>
    <Field label="شناسه فروش (SKU)" htmlFor="sku" required><Input ltr id="sku" name="sku" maxLength={80} defaultValue={product?.sku} /></Field>
    <Field label="برند قطعه" htmlFor="brand" required><Select id="brand" name="brand" value={selectedBrand || ''} onChange={e=>setSelectedBrand(Number(e.target.value))}>
      <option value="">— انتخاب کنید —</option>{choices.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
    </Select></Field>
    <Fieldset legend="دسته‌بندی‌های محصول">
      {categoryTree(choices.categories).map(({ category, depth }) =>
        <Checkbox key={category.id} name="category" value={category.id}
          defaultChecked={product?.categoryIds.includes(category.id)}
          label={'— '.repeat(depth) + String(category.values.name ?? '')} />)}
    </Fieldset>
    <Field label="کشور تولید" htmlFor="country" required={eav.countryRequired}><Select id="country" name="country" defaultValue={product?.countryCode ?? ''}>
      <option value="">— نامعلوم —</option>{choices.countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
    </Select></Field>
    <FluidStandards mode="product" model={fluids}/>
    <ProductFitments model={fitments} vehicles={choices.vehicles}/>
    <ProductNumbers model={numberForm} choices={choices} brandId={selectedBrand}/>
    <FieldTabs tabs={tabs} active={tab.active} onSelect={tab.setActive} values={values}
      onChange={(code, value) => setValues(old => ({ ...old, [code]: value }))} />
    <FormActions><Button type="submit" variant="primary" disabled={Boolean(form.busy)}>ذخیره محصول</Button><Button href={LIST}>انصراف</Button></FormActions>
  </Form>;
}
