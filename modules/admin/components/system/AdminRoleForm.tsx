'use client';

import { useState, type FormEvent } from 'react';
import { useAdminForm } from '@admin/lib/client-api';
import type { AdminRole, PermissionInfo } from '@admin/lib/types';
import {
  Button,
  Checkbox,
  Field,
  Fieldset,
  Form,
  FormActions,
  FormError,
  Hint,
  Input,
  Spacer,
} from '../ui';

type Props = {
  permissions: PermissionInfo[];
  /** edit mode when given */
  role?: AdminRole;
};

/** «افزودن نقش» / «ویرایش نقش»: name + which parts of the panel it may use. */
export default function AdminRoleForm({ permissions, role }: Props) {
  const form = useAdminForm('/admin/system/roles');
  const editing = Boolean(role);
  const [name, setName] = useState(role?.name ?? '');
  const [all, setAll] = useState(role?.allPermissions ?? false);
  // keys come from GET /permissions (the backend's list), so they're plain strings here
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);

  // permissions grouped by their menu path («سایت › دسترسی‌ها»)
  const groups = [...new Set(permissions.map((p) => p.group))].map((g) => ({
    title: g,
    items: permissions.filter((p) => p.group === g),
  }));

  function toggle(key: string, on: boolean) {
    setSelected((s) => (on ? [...s, key] : s.filter((k) => k !== key)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      form.setError('نام نقش را وارد کنید.');
      return;
    }
    const body = { name, allPermissions: all, permissions: all ? [] : selected };
    await (editing
      ? form.send('PUT', `/roles/${role!.id}`, body, 'تغییرات نقش ذخیره شد.')
      : form.send('POST', '/roles', body, 'نقش جدید ساخته شد.'));
  }

  async function onDelete() {
    if (!role) return;
    await form.send('DELETE', `/roles/${role.id}`, undefined, `نقش «${role.name}» حذف شد.`, {
      title: 'حذف نقش',
      message: `نقش «${role.name}» حذف شود؟ این کار برگشت‌پذیر نیست.`,
    });
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{form.error}</FormError>

      <Field label="نام نقش" htmlFor="name" required>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Checkbox
        label={<strong>همه‌ی دسترسی‌ها</strong>}
        hint="به همه‌ی بخش‌های پنل دسترسی دارد، از جمله بخش‌هایی که بعداً اضافه می‌شوند."
        checked={all}
        onChange={(e) => setAll(e.target.checked)}
      />

      {groups.map((g) => (
        <Fieldset key={g.title} legend={g.title} disabled={all}>
          {g.items.map((p) => (
            <Checkbox
              key={p.key}
              label={p.label}
              checked={all || selected.includes(p.key)}
              onChange={(e) => toggle(p.key, e.target.checked)}
            />
          ))}
        </Fieldset>
      ))}
      <Hint>داشبورد برای همه‌ی نقش‌ها باز است.</Hint>

      <FormActions>
        <Button type="submit" variant="primary" loading={form.busy === 'save'} disabled={form.busy !== ''}>
          {form.busy === 'save' ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت نقش'}
        </Button>
        <Button href="/admin/system/roles">انصراف</Button>
        {editing && (
          <>
            <Spacer />
            <Button variant="danger" onClick={onDelete} loading={form.busy === 'delete'} disabled={form.busy !== ''}>
              حذف نقش
            </Button>
          </>
        )}
      </FormActions>
    </Form>
  );
}
