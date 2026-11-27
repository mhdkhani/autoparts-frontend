'use client';

import { type FormEvent } from 'react';
import { useAdminForm } from '@admin/lib/client-api';
import FluidStandards, { useFluidStandards } from './FluidStandards';
import { vehicleStates, type Vehicle } from '@admin/lib/vehicles';
import { Button, Field, Fieldset, Form, FormActions, FormError, Input, Select } from '../ui';
import css from './catalog.module.css';

type Key = Exclude<keyof Vehicle, 'id' | 'makeId' | 'modelId' | 'generationId' | 'status' | 'fluidRequirements'>;
type Spec = [Key, string, ('number' | 'period' | 'required')?];
const groups: { name: string; fields: Spec[] }[] = [
  {
    name: 'هویت خودرو',
    fields: [
      ['group', 'گروه خودروسازی'],
      ['groupEn', 'نام انگلیسی گروه'],
      ['make', 'برند خودرو', 'required'],
      ['makeEn', 'نام انگلیسی برند'],
      ['model', 'مدل', 'required'],
      ['modelEn', 'نام انگلیسی مدل'],
      ['modelSlug', 'نامک مدل'],
      ['generation', 'نسل', 'required'],
      ['chassis', 'کد اتاق'],
      ['fromYear', 'سال شروع نسل', 'number'],
      ['toYear', 'سال پایان نسل', 'number'],
      ['facelift', 'فیس‌لیفت'],
      ['faceliftFrom', 'آغاز فیس‌لیفت (YYYY-MM-DD)'],
      ['faceliftTo', 'پایان فیس‌لیفت (YYYY-MM-DD)'],
      ['faceliftMarket', 'بازار فیس‌لیفت'],
      ['trim', 'تیپ'],
    ],
  },
  {
    name: 'مشخصات فنی نسخه',
    fields: [
      ['engineCode', 'کد موتور'],
      ['displacementCc', 'حجم موتور (cc)', 'number'],
      ['fuel', 'سوخت'],
      ['aspiration', 'تنفس موتور'],
      ['powerHp', 'قدرت موتور (hp)', 'number'],
      ['gearboxCode', 'کد گیربکس'],
      ['gearboxType', 'نوع گیربکس'],
      ['gears', 'تعداد دنده', 'number'],
      ['drive', 'انتقال نیرو'],
      ['doors', 'تعداد در', 'number'],
      ['market', 'بازار عرضه'],
      ['productionFrom', 'تولید از', 'period'],
      ['productionTo', 'تولید تا', 'period'],
      ['modification', 'کد نسخه فنی'],
      ['framePrefix', 'پیشوند شاسی'],
    ],
  },
  {
    name: 'منبع و بازبینی',
    fields: [
      ['source', 'مرجع یا نشانی کاتالوگ'],
      ['externalId', 'شناسه نسخه در منبع'],
    ],
  },
];
const LIST = '/admin/catalog/vehicles';
export default function VehicleForm({
  vehicle,
  known,
  makes = [],
}: {
  vehicle?: Vehicle;
  known: Vehicle[];
  makes?: string[];
}) {
  const fluids = useFluidStandards(vehicle?.fluidRequirements);
  const form = useAdminForm(LIST);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload: Record<string, string | number | null> = { status: String(data.get('status')) };
    for (const g of groups)
      for (const [key, label, type] of g.fields) {
        const val = String(data.get(key) ?? '').trim();
        if (type === 'required' && !val) {
          form.setError('«' + label + '» را وارد کنید');
          return;
        }
        payload[key] = !val ? null : type === 'number' ? Number(val) : val;
      }
    await form.send(
      vehicle ? 'PUT' : 'POST',
      '/catalog/vehicles' + (vehicle ? '/' + vehicle.id : ''),
      { ...payload, fluidRequirements: fluids.payload },
      'نسخه خودرو ذخیره شد.',
    );
  }
  return (
    <Form onSubmit={submit}>
      <FormError>{form.error}</FormError>
      {groups.map((g) => (
        <Fieldset key={g.name} legend={g.name}>
          <div className={css.twoCols}>
            {g.fields.map(([key, label, type]) => {
              const list =
                key === 'make'
                  ? makes
                  : [
                      ...new Set(
                        known
                          .map((v) => v[key])
                          .filter((v) => v !== null)
                          .map(String),
                      ),
                    ];
              return (
                <Field
                  key={key}
                  label={label}
                  htmlFor={key}
                  required={type === 'required'}
                  hint={type === 'period' ? 'سال میلادی، سال-ماه یا تاریخ دقیق طبق منبع' : undefined}
                >
                  {key === 'drive' ? (
                    <Select id={key} name={key} defaultValue={vehicle?.drive ?? ''}>
                      <option value="">نامعلوم</option>
                      {['FWD', 'RWD', 'AWD', '4WD'].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={key}
                      name={key}
                      list={list.length ? 'list-' + key : undefined}
                      type={type === 'number' ? 'number' : 'text'}
                      step={key === 'powerHp' ? '0.1' : undefined}
                      defaultValue={vehicle?.[key] ?? ''}
                    />
                  )}
                  {list.length > 0 && (
                    <datalist id={'list-' + key}>
                      {list.map((v) => (
                        <option value={v} key={v} />
                      ))}
                    </datalist>
                  )}
                </Field>
              );
            })}
          </div>
        </Fieldset>
      ))}
      <Field label="وضعیت نسخه" htmlFor="status">
        <Select id="status" name="status" defaultValue={vehicle?.status ?? 'draft'}>
          {Object.entries(vehicleStates).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <FluidStandards mode="vehicle" model={fluids} />
      <FormActions>
        <Button type="submit" variant="primary" disabled={!!form.busy}>
          ذخیره نسخه خودرو
        </Button>
        <Button href={LIST}>انصراف</Button>
      </FormActions>
    </Form>
  );
}
