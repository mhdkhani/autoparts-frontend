'use client';

import { useState, type FormEvent } from 'react';
import { adminUpload, useAdminForm } from '@admin/lib/client-api';
import { META_ROBOTS, type Brand, type Country } from '@admin/lib/types';
import { Button, FieldTabs, Form, FormActions, FormError, Spacer, useFieldTabs, type FieldTab, type UploadImage } from '../ui';

const LIST = '/admin/catalog/brands';
const uploadImage: UploadImage = (file) => adminUpload('/catalog/brands/upload', file);

/** The form's values as strings ('' = no value); aliases one per line. */
type Values = Record<
  | 'nameFa'
  | 'nameEn'
  | 'originCountryCode'
  | 'aliases'
  | 'description'
  | 'logo'
  | 'urlKey'
  | 'metaTitle'
  | 'metaKeywords'
  | 'metaDescription'
  | 'metaRobots',
  string
>;

/**
 * Fields of a part brand (Master §۲۲ «Product Brand», §۹ brand_aliases; SEO per P22 / §۱۲ / نیاز فنی (ز)) in three
 * tabs: «عمومی»، «معرفی برند» (the brand part of the product page) and «سئو» (the brand page).
 */
const tabsOf = (countries: Country[]): FieldTab[] => [
  {
    key: 'general',
    label: 'عمومی',
    fields: [
      { key: 'nameFa', label: 'نام فارسی', required: true, field: { type: 'text', maxLength: 160 } },
      { key: 'nameEn', label: 'نام انگلیسی', field: { type: 'text', maxLength: 160, ltr: true }, hint: 'مثل Bosch یا RIDEX.' },
      {
        key: 'originCountryCode',
        label: 'کشور مبدأ برند',
        field: {
          type: 'select',
          options: countries.map((c) => ({ value: c.code, label: c.nameFa })),
          placeholder: '— انتخاب نشده —',
        },
        hint: 'کشور خودِ برند؛ کشور ساخت هر کالا جدا در محصول ثبت می‌شود.',
      },
      {
        key: 'aliases',
        label: 'نام‌های دیگر',
        field: { type: 'textarea' },
        hint: 'هر نام در یک خط: نوشتارهای دیگر برند برای جستجو، مثل «بوش» یا «BOSCH». هر نام فقط مال یک برند است.',
      },
    ],
  },
  {
    key: 'about',
    label: 'معرفی برند',
    fields: [
      {
        key: 'description',
        label: 'معرفی برند',
        field: { type: 'editor' },
        hint: 'در بخش «معرفی برند» صفحه‌ی محصول و در صفحه‌ی برند نمایش داده می‌شود.',
      },
      { key: 'logo', label: 'لوگو', field: { type: 'image' }, hint: 'PNG، JPG یا WebP — حداکثر ۲ مگابایت.' },
    ],
  },
  {
    key: 'seo',
    label: 'سئو',
    fields: [
      {
        key: 'urlKey',
        label: 'آدرس (URL)',
        required: true,
        field: { type: 'text', maxLength: 200, ltr: true },
        hint: 'آدرس صفحه‌ی برند، مثل bosch. در کل برندها یکتاست.',
      },
      { key: 'metaTitle', label: 'عنوان متا (meta title)', field: { type: 'text', maxLength: 255 }, hint: 'خالی = نام برند.' },
      { key: 'metaKeywords', label: 'کلمات کلیدی متا (meta keywords)', field: { type: 'textarea', maxLength: 500 }, hint: 'با «،» جدا کنید.' },
      {
        key: 'metaDescription',
        label: 'توضیحات متا (meta description)',
        field: { type: 'textarea', maxLength: 500 },
        hint: 'خلاصه‌ای که زیر عنوان در نتایج جستجو می‌آید؛ حدود ۱۵۰ کاراکتر.',
      },
      {
        key: 'metaRobots',
        label: 'متا تگ robots',
        field: { type: 'select', options: [...META_ROBOTS], placeholder: '— پیش‌فرض سایت —' },
      },
    ],
  },
];

/** Stored brand → form strings. */
function valuesOf(brand?: Brand): Values {
  return {
    nameFa: brand?.nameFa ?? '',
    nameEn: brand?.nameEn ?? '',
    originCountryCode: brand?.originCountryCode ?? '',
    aliases: brand?.aliases.join('\n') ?? '',
    description: brand?.description ?? '',
    logo: brand?.logo ?? '',
    urlKey: brand?.urlKey ?? '',
    metaTitle: brand?.metaTitle ?? '',
    metaKeywords: brand?.metaKeywords ?? '',
    metaDescription: brand?.metaDescription ?? '',
    metaRobots: brand?.metaRobots ?? '',
  };
}

/** «افزودن / ویرایش برند قطعه». */
export default function BrandForm({ countries, brand }: { countries: Country[]; brand?: Brand }) {
  const form = useAdminForm(LIST);
  const tabs = tabsOf(countries);
  const tab = useFieldTabs(tabs, form.setError);
  const [values, setValues] = useState<Values>(() => valuesOf(brand));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tab.checkRequired(values)) return;
    // '' → null (no value); aliases: one per line, blank lines dropped
    const body = {
      ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() === '' ? null : v])),
      aliases: values.aliases.split('\n').map((a) => a.trim()).filter(Boolean),
    };
    await (brand
      ? form.send('PUT', `/catalog/brands/${brand.id}`, body, 'تغییرات برند ذخیره شد.')
      : form.send('POST', '/catalog/brands', body, 'برند جدید ساخته شد.'));
  }

  async function onDelete() {
    await form.send('DELETE', `/catalog/brands/${brand!.id}`, undefined, `برند «${brand!.nameFa}» حذف شد.`, {
      title: 'حذف برند',
      message: `برند «${brand!.nameFa}» و نام‌های دیگرش حذف شوند؟ این کار برگشت‌پذیر نیست.`,
    });
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{form.error}</FormError>

      <FieldTabs
        tabs={tabs}
        values={values}
        onChange={(key, v) => setValues((s) => ({ ...s, [key]: v }))}
        uploadImage={uploadImage}
        active={tab.active}
        onSelect={tab.setActive}
      />

      <FormActions>
        <Button type="submit" variant="primary" loading={form.busy === 'save'} disabled={form.busy !== ''}>
          {form.busy === 'save' ? 'در حال ذخیره…' : brand ? 'ذخیره‌ی تغییرات' : 'ساخت برند'}
        </Button>
        <Button href={LIST}>انصراف</Button>
        {brand && (
          <>
            <Spacer />
            <Button variant="danger" onClick={onDelete} loading={form.busy === 'delete'} disabled={form.busy !== ''}>
              حذف برند
            </Button>
          </>
        )}
      </FormActions>
    </Form>
  );
}
