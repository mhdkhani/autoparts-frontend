'use client';
import { useState } from 'react';
import type { Standard } from '@admin/lib/vehicles';
import { Button, Field, Fieldset, Input, Select } from '../ui';

export function useFluidStandards(initial: Standard[] = []) {
  const [rows, setRows] = useState(initial);
  const [changed, setChanged] = useState(false);
  function change(next: Standard[]) {
    setRows(next);
    setChanged(true);
  }
  return { rows, change, payload: changed ? rows : undefined };
}

export default function FluidStandards({
  mode,
  model,
}: {
  mode: 'product' | 'vehicle';
  model: ReturnType<typeof useFluidStandards>;
}) {
  const product = mode === 'product';
  return (
    <Fieldset legend={product ? 'استانداردهای مستند سیال' : 'استاندارد سیال موردنیاز خودرو'}>
      {model.rows.map((row, i) => {
        function update(patch: Partial<Standard>) {
          model.change(model.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
        }
        const fields: Partial<Record<keyof Standard, string>> = {
          issuer: 'صادرکننده',
          code: 'کد استاندارد',
          revision: 'ویرایش استاندارد',
          source: 'مرجع مستند',
        };
        if (!product) fields.application = 'کاربرد سیال';
        return (
          <Fieldset key={i} legend={row.code || 'استاندارد جدید'}>
            {(Object.entries(fields) as [keyof Standard, string][]).map(([key, label]) => (
              <Field key={key} label={label} htmlFor={'fluid-' + key + i}>
                <Input
                  id={'fluid-' + key + i}
                  value={row[key] ?? ''}
                  onChange={(e) => update({ [key]: e.target.value || null })}
                />
              </Field>
            ))}
            {product && (
              <Field label="نوع ادعا" htmlFor={'claim' + i}>
                <Select id={'claim' + i} value={row.claimType} onChange={(e) => update({ claimType: e.target.value })}>
                  <option value="approval">تأییدیه رسمی</option>
                  <option value="meets">انطباق اعلام‌شده</option>
                  <option value="recommended">توصیه سازنده</option>
                </Select>
              </Field>
            )}
            <Button type="button" onClick={() => model.change(model.rows.filter((_, j) => i !== j))}>
              حذف استاندارد
            </Button>
          </Fieldset>
        );
      })}
      <Button
        type="button"
        onClick={() =>
          model.change([
            ...model.rows,
            { issuer: '', code: '', source: '', ...(product ? { claimType: 'recommended' } : { application: '' }) },
          ])
        }
      >
        افزودن استاندارد سیال
      </Button>
    </Fieldset>
  );
}
