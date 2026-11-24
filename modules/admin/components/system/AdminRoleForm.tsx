'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
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
  useConfirm,
  useToast,
} from '../ui';

type Props = {
  permissions: PermissionInfo[];
  /** edit mode when given */
  role?: AdminRole;
};

/** «افزودن نقش» / «ویرایش نقش»: name + which parts of the panel it may use. */
export default function AdminRoleForm({ permissions, role }: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const editing = Boolean(role);
  const [name, setName] = useState(role?.name ?? '');
  const [all, setAll] = useState(role?.allPermissions ?? false);
  // keys come from GET /permissions (the backend's list), so they're plain strings here
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('');

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
      setError('نام نقش را وارد کنید.');
      return;
    }
    setError('');
    setBusy('save');
    const body = { name, allPermissions: all, permissions: all ? [] : selected };
    const res = editing
      ? await adminSend('PUT', `/roles/${role!.id}`, body)
      : await adminSend('POST', '/roles', body);
    if (!res.ok) {
      setError(res.error);
      setBusy('');
      return;
    }
    toast.success(editing ? 'تغییرات نقش ذخیره شد.' : 'نقش جدید ساخته شد.');
    router.push('/admin/system/roles');
    router.refresh();
  }

  async function onDelete() {
    if (!role) return;
    const ok = await confirm({
      title: 'حذف نقش',
      message: `نقش «${role.name}» حذف شود؟ این کار برگشت‌پذیر نیست.`,
      danger: true,
    });
    if (!ok) return;
    setError('');
    setBusy('delete');
    const res = await adminSend('DELETE', `/roles/${role.id}`);
    if (!res.ok) {
      setError(res.error);
      setBusy('');
      return;
    }
    toast.success(`نقش «${role.name}» حذف شد.`);
    router.push('/admin/system/roles');
    router.refresh();
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{error}</FormError>

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
        <Button type="submit" variant="primary" loading={busy === 'save'} disabled={busy !== ''}>
          {busy === 'save' ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت نقش'}
        </Button>
        <Button href="/admin/system/roles">انصراف</Button>
        {editing && (
          <>
            <Spacer />
            <Button variant="danger" onClick={onDelete} loading={busy === 'delete'} disabled={busy !== ''}>
              حذف نقش
            </Button>
          </>
        )}
      </FormActions>
    </Form>
  );
}
