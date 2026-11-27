'use client';

import { useState, type FormEvent } from 'react';
import { adminUpload, useAdminForm } from '@admin/lib/client-api';
import { categoryTree, type Category, type EavForm } from '@admin/lib/types';
import {
  Button,
  Field,
  FieldTabs,
  Form,
  FormActions,
  FormError,
  Input,
  Select,
  Spacer,
  useFieldTabs,
  type UploadImage,
} from '../ui';
import { tabsOf, formValue } from './eav-form';
import css from './catalog.module.css';

const LIST = '/admin/catalog/categories';
const uploadImage: UploadImage = (file) => adminUpload('/catalog/categories/upload', file);

/**
 * «افزودن / ویرایش دسته»: parent and order in the tree, then the category attribute set as tabs («عمومی»، «محتوا»،
 * «سئو») — tabs, fields, required flags and defaults all come from the form the API returns, nothing is hard-coded.
 */
export default function CategoryForm({
  categories,
  form: eav,
  category,
  defaultParentId,
}: {
  /** the whole tree (parent dropdown) */
  categories: Category[];
  /** the category attribute set as a form (tabs → fields) */
  form: EavForm;
  /** edit mode when given */
  category?: Category;
  /** new category: preselected parent («+ زیرشاخه») */
  defaultParentId?: number;
}) {
  const form = useAdminForm(LIST);
  const editing = Boolean(category);
  const fields = eav.groups.flatMap((g) => g.fields);
  const tabs = tabsOf(eav);
  const tab = useFieldTabs(tabs, form.setError);
  const [parentId, setParentId] = useState(String(category?.parentId ?? defaultParentId ?? ''));
  const [position, setPosition] = useState(category ? String(category.position) : '');
  // edit: the stored values; new: each field's default value
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.code, category ? formValue(f, category.values[f.code]) : (f.defaultValue ?? '')])),
  );

  // possible parents: the tree, minus this category and its own sub-tree (a category can't sit under itself)
  const tree = categoryTree(categories);
  const self = tree.findIndex((t) => t.category.id === category?.id);
  const subtreeEnd = self < 0 ? -1 : tree.findIndex((t, i) => i > self && t.depth <= tree[self].depth);
  const parents = self < 0 ? tree : tree.filter((_, i) => i < self || (subtreeEnd >= 0 && i >= subtreeEnd));
  const hasChildren = Boolean(category && categories.some((c) => c.parentId === category.id));
  const name = (c: Category) => String(c.values.name ?? '');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tab.checkRequired(values)) return;
    if (position.trim() && !/^\d+$/.test(position.trim())) {
      form.setError('ترتیب نمایش باید عدد صحیح باشد.');
      return;
    }
    const body = {
      parentId: parentId ? Number(parentId) : null,
      ...(position.trim() && { position: Number(position) }),
      values,
    };
    await (editing
      ? form.send('PUT', `/catalog/categories/${category!.id}`, body, 'تغییرات دسته ذخیره شد.')
      : form.send('POST', '/catalog/categories', body, 'دسته‌ی جدید ساخته شد.'));
  }

  async function onDelete() {
    await form.send('DELETE', `/catalog/categories/${category!.id}`, undefined, `دسته‌ی «${name(category!)}» حذف شد.`, {
      title: 'حذف دسته',
      message: `دسته‌ی «${name(category!)}» حذف شود؟ این کار برگشت‌پذیر نیست.`,
    });
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{form.error}</FormError>

      <div className={css.twoCols}>
        <Field label="دسته‌ی والد" htmlFor="parentId">
          <Select id="parentId" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— دسته‌ی اصلی (بدون والد) —</option>
            {parents.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>
                {'— '.repeat(depth)}
                {name(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="ترتیب نمایش"
          htmlFor="position"
          hint={editing ? 'بین هم‌سطح‌ها؛ عدد کمتر اول.' : 'عدد کمتر اول؛ خالی = آخر.'}
        >
          <Input id="position" ltr type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} />
        </Field>
      </div>

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
          {form.busy === 'save' ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت دسته'}
        </Button>
        <Button href={LIST}>انصراف</Button>
        {editing && (
          <>
            <Spacer />
            <Button
              variant="danger"
              onClick={onDelete}
              loading={form.busy === 'delete'}
              disabled={form.busy !== '' || hasChildren}
              title={hasChildren ? 'اول زیرشاخه‌های این دسته را جابه‌جا یا حذف کنید' : undefined}
            >
              حذف دسته
            </Button>
          </>
        )}
      </FormActions>
    </Form>
  );
}
