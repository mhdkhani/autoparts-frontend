'use client';

import { useState } from 'react';
import { Button, Field, Fieldset, Input, Select } from '../ui';
import { fitmentStates, vehicleName, type Vehicle, type Fitment, type FitmentRule } from '@admin/lib/vehicles';
import css from './catalog.module.css';

const ruleFields = [
  ['fromDate', 'تاریخ تولید از'],
  ['toDate', 'تاریخ تولید تا'],
  ['axle', 'محور'],
  ['side', 'سمت نصب'],
  ['steering', 'فرمان'],
  ['withEquipment', 'تجهیز الزامی'],
  ['withoutEquipment', 'تجهیز ممنوع'],
  ['source', 'مرجع شرط'],
] as const;
const options: Record<string, Record<string, string>> = {
  axle: { front: 'جلو', rear: 'عقب' },
  side: { left: 'چپ', right: 'راست' },
  steering: { LHD: 'چپ‌فرمان', RHD: 'راست‌فرمان' },
};
export function useFitments(initial: Fitment[] = []) {
  const [changed, setChanged] = useState(false);
  const [rows, setRows] = useState(() =>
    initial.map((f, key) => ({
      key,
      fitment: {
        configId: f.configId,
        status: f.status,
        source: f.source,
        note: f.note,
        rules: f.rules.map(
          (r) => Object.fromEntries([['effect', r.effect], ...ruleFields.map(([k]) => [k, r[k] ?? null])]) as FitmentRule,
        ),
      },
    })),
  );
  const [next, setNext] = useState(initial.length);
  return {
    rows,
    payload: changed ? rows.map((r) => r.fitment) : undefined,
    add() {
      setChanged(true);
      setRows([
        ...rows,
        { key: next, fitment: { configId: 0, status: 'needs_review', source: null, note: null, rules: [] } },
      ]);
      setNext(next + 1);
    },
    remove(key: number) {
      setChanged(true);
      setRows(rows.filter((r) => r.key !== key));
    },
    update(key: number, data: Partial<Fitment>) {
      setChanged(true);
      setRows(rows.map((r) => (r.key === key ? { ...r, fitment: { ...r.fitment, ...data } } : r)));
    },
  };
}

function VehiclePicker({
  vehicles,
  id,
  select,
  prefix,
}: {
  vehicles: Vehicle[];
  id: number;
  select: (id: number) => void;
  prefix: string;
}) {
  const selected = vehicles.find((v) => v.id === id);
  const [make, setMake] = useState(selected?.makeId ?? 0),
    [model, setModel] = useState(selected?.modelId ?? 0),
    [generation, setGeneration] = useState(selected?.generationId ?? 0);
  const brandRows = vehicles.filter((v) => v.makeId === make),
    modelRows = brandRows.filter((v) => v.modelId === model);
  const steps = [
    {
      key: 'make',
      label: 'برند خودرو',
      value: make,
      entries: new Map(vehicles.map((v) => [v.makeId, v.make])),
      change: (n: number) => {
        setMake(n);
        setModel(0);
        setGeneration(0);
      },
    },
    {
      key: 'model',
      label: 'مدل',
      value: model,
      entries: new Map(brandRows.map((v) => [v.modelId, v.model])),
      change: (n: number) => {
        setModel(n);
        setGeneration(0);
      },
    },
    {
      key: 'generation',
      label: 'نسل',
      value: generation,
      entries: new Map(modelRows.map((v) => [v.generationId, v.generation])),
      change: setGeneration,
    },
  ];
  return (
    <div className={css.twoCols}>
      {steps.map((s) => (
        <Field key={s.key} label={s.label} htmlFor={prefix + s.key}>
          <Select
            id={prefix + s.key}
            value={s.value || ''}
            disabled={!s.entries.size}
            onChange={(e) => {
              s.change(Number(e.target.value));
              select(0);
            }}
          >
            <option value="">انتخاب کنید</option>
            {Array.from(s.entries, ([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      ))}
      <Field label="نسخه دقیق خودرو" htmlFor={prefix + 'version'} required>
        <Select
          id={prefix + 'version'}
          value={id || ''}
          disabled={!generation}
          onChange={(e) => select(Number(e.target.value))}
        >
          <option value="">انتخاب کنید</option>
          {modelRows
            .filter((v) => v.generationId === generation)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {vehicleName(v)}
              </option>
            ))}
        </Select>
      </Field>
    </div>
  );
}
export default function ProductFitments({
  model: m,
  vehicles,
}: {
  model: ReturnType<typeof useFitments>;
  vehicles: Vehicle[];
}) {
  return (
    <Fieldset legend="خودروهای سازگار">
      {m.rows.map(({ key, fitment: f }) => {
        const prefix = 'fit-' + key + '-';
        const update = (change: Partial<Fitment>) => m.update(key, change);
        const changeRule = (i: number, change: Partial<FitmentRule>) =>
          update({ rules: f.rules.map((r, j) => (i === j ? { ...r, ...change } : r)) });
        return (
          <Fieldset key={key} legend={vehicles.find((v) => v.id === f.configId)?.model ?? 'تطابق جدید'}>
            <VehiclePicker vehicles={vehicles} id={f.configId} select={(configId) => update({ configId })} prefix={prefix} />
            <Field label="وضعیت سازگاری" htmlFor={prefix + 'status'}>
              <Select id={prefix + 'status'} value={f.status} onChange={(e) => update({ status: e.target.value })}>
                {Object.entries(fitmentStates)
                  .filter(([v]) => v !== 'unknown')
                  .map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="منبع تطابق" htmlFor={prefix + 'source'} required={f.status !== 'needs_review'}>
              <Input
                id={prefix + 'source'}
                value={f.source ?? ''}
                onChange={(e) => update({ source: e.target.value || null })}
              />
            </Field>
            <Field label="توضیح نصب" htmlFor={prefix + 'note'}>
              <Input id={prefix + 'note'} value={f.note ?? ''} onChange={(e) => update({ note: e.target.value || null })} />
            </Field>
            {f.rules.map((r, i) => (
              <Fieldset key={i} legend={'شرط نصب ' + (i + 1)}>
                <Field label="نوع شرط" htmlFor={prefix + 'effect' + i}>
                  <Select
                    id={prefix + 'effect' + i}
                    value={r.effect}
                    onChange={(e) => changeRule(i, { effect: e.target.value })}
                  >
                    <option value="include">شمول</option>
                    <option value="exclude">استثنا</option>
                  </Select>
                </Field>
                <div className={css.twoCols}>
                  {ruleFields.map(([k, label]) => (
                    <Field key={k} label={label} htmlFor={prefix + k + i}>
                      {options[k] ? (
                        <Select
                          id={prefix + k + i}
                          value={r[k] ?? ''}
                          onChange={(e) => changeRule(i, { [k]: e.target.value || null })}
                        >
                          <option value="">بدون قید</option>
                          {Object.entries(options[k]).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={prefix + k + i}
                          type={k === 'fromDate' || k === 'toDate' ? 'date' : 'text'}
                          value={r[k] ?? ''}
                          onChange={(e) => changeRule(i, { [k]: e.target.value || null })}
                        />
                      )}
                    </Field>
                  ))}
                </div>
                <Button type="button" onClick={() => update({ rules: f.rules.filter((_, j) => j !== i) })}>
                  حذف شرط
                </Button>
              </Fieldset>
            ))}
            <Button
              type="button"
              onClick={() => update({ status: 'conditional', rules: [...f.rules, { effect: 'include' }] })}
            >
              افزودن شرط نصب
            </Button>
            <Button type="button" onClick={() => m.remove(key)}>
              برداشتن تطابق از محصول
            </Button>
          </Fieldset>
        );
      })}
      {vehicles.length === 0 && <p>برای ثبت تطابق، ابتدا یک نسخه در بانک خودرو تعریف کنید.</p>}
      <Button type="button" disabled={!vehicles.length} onClick={m.add}>
        افزودن نسخه‌ی خودرو
      </Button>
    </Fieldset>
  );
}
