'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { adminSend, adminUpload } from '@admin/lib/client-api';
import type { ConfigSection, ConfigValues } from '@admin/lib/types';
import { Button, Card, FieldControl, FormError, Spacer, useToast, type UploadImage } from '../ui';
import ui from '../ui/ui.module.css';
import css from './config.module.css';

/** Image fields of the settings (logo, …) are uploaded here; the returned URL is saved with the section. */
const uploadImage: UploadImage = (file) => adminUpload('/config/upload', file);

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
                    <FieldControl
                      id={path}
                      field={f}
                      value={values[path] ?? ''}
                      onChange={(v) => set(path, v)}
                      uploadImage={uploadImage}
                    />
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
