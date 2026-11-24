'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import type { ConfigField, ConfigSection, ConfigValues } from '@admin/lib/types';
import { Button, Card, FormError, Input, Select, Spacer, Textarea, useToast } from '../ui';
import ui from '../ui/ui.module.css';
import css from './config.module.css';

/** One settings section: its groups as cards, every field in a label | control row, one Save button. */
export default function ConfigSectionForm({
  section,
  initial,
}: {
  section: ConfigSection;
  initial: ConfigValues;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState<ConfigValues>(initial);
  const [values, setValues] = useState<ConfigValues>(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changed = Object.keys(values).filter((p) => values[p] !== saved[p]);
  const dirty = changed.length > 0;

  // warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set(path: string, value: string) {
    setValues((v) => ({ ...v, [path]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = { values: Object.fromEntries(changed.map((p) => [p, values[p]])) };
    const res = await adminSend<{ values: ConfigValues }>('PUT', `/config/${section.key}`, body);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(res.data.values);
    setValues(res.data.values);
    toast.success('تنظیمات ذخیره شد.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormError>{error}</FormError>

      {section.groups.map((g) => (
        <Card key={g.key} title={g.label} description={g.description} flush>
          <div className={css.fields}>
            {g.fields.map((f) => {
              const path = `${section.key}/${g.key}/${f.key}`;
              return (
                <div key={path} className={css.row}>
                  <label className={css.rowLabel} htmlFor={path}>
                    {f.label}
                  </label>
                  <div>
                    <FieldControl id={path} field={f} value={values[path] ?? ''} onChange={(v) => set(path, v)} />
                    {f.comment && <div className={ui.hint}>{f.comment}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className={css.saveBar}>
        <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
          {saving ? 'در حال ذخیره…' : 'ذخیره‌ی تنظیمات'}
        </Button>
        {dirty && <span className={css.dirty}>تغییرات ذخیره نشده دارید.</span>}
        {dirty && (
          <>
            <Spacer />
            <Button onClick={() => setValues(saved)} disabled={saving}>
              لغو تغییرات
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

type ControlProps = {
  id: string;
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
};

function FieldControl({ id, field, value, onChange }: ControlProps) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          id={id}
          ltr={field.ltr}
          maxLength={field.maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'textarea':
      return <Textarea id={id} maxLength={field.maxLength} value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'boolean':
      return (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="1">فعال</option>
          <option value="0">غیرفعال</option>
        </Select>
      );
    case 'select':
      return (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case 'image':
      return <ImageControl id={id} value={value} onChange={onChange} />;
  }
}

/** Preview + upload (POST /admin/config/upload) + remove. The URL becomes the field value; it's stored on Save. */
function ImageControl({ id, value, onChange }: Omit<ControlProps, 'field'>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    const res = await adminSend<{ url: string }>('POST', '/config/upload', form);
    setBusy(false);
    if (input.current) input.current.value = '';
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onChange(res.data.url);
  }

  return (
    <div>
      <div className={css.logoBox}>
        <div className={css.logoPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element -- served by nginx from the media volume */}
          {value ? <img src={value} alt="" /> : 'بدون تصویر'}
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <Button onClick={() => input.current?.click()} loading={busy}>
          {busy ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}
        </Button>
        {value && (
          <Button variant="danger" onClick={() => onChange('')} disabled={busy}>
            حذف
          </Button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.5rem' }}><FormError>{error}</FormError></div>}
    </div>
  );
}
