'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAdminForm } from '@admin/lib/client-api';
import {
  ADMIN_ATTRIBUTE_TYPES,
  FILTERABLE_TYPES,
  NUMERIC_TYPES,
  OPTION_TYPES,
  TEXT_TYPES,
  type AttributeDetail,
  type AttributeType,
} from '@admin/lib/types';
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
  moveItem,
  OrderButtons,
  Select,
  Spacer,
  Textarea,
} from '../ui';
import css from './catalog.module.css';

const LIST = '/admin/catalog/attributes';

/** `key` = React key (new rows have no id yet); `id` = saved option (its code is then read-only) */
type OptionRow = { key: string; id?: number; code: string; labelFa: string; labelEn: string };
const FLAGS = [
  { key: 'isFilterable', label: 'فیلتر در صفحه‌ی دسته‌بندی', hint: 'عددها به‌صورت بازه، فهرست‌ها با چک‌باکس.' },
  { key: 'isSearchable', label: 'در جستجوی سایت پیدا شود' },
] as const;
type Flag = (typeof FLAGS)[number]['key'];

let nextKey = 0;
const newKey = () => `new-${++nextKey}`;
const numText = (n: number | undefined) => (n === undefined ? '' : String(n));

/** «افزودن ویژگی» / «ویرایش ویژگی». Code and type are fixed after creation (stored values depend on them). */
export default function AttributeForm({
  attribute,
  sets = [],
}: {
  /** edit mode when given */
  attribute?: AttributeDetail;
  /** sets that use this attribute (edit mode) */
  sets?: { id: number; name: string }[];
}) {
  const form = useAdminForm(LIST);
  const editing = Boolean(attribute);
  const [code, setCode] = useState(attribute?.code ?? '');
  const [dataType, setDataType] = useState<AttributeType>(attribute?.dataType ?? 'text');
  const [labelFa, setLabelFa] = useState(attribute?.labelFa ?? '');
  const [labelEn, setLabelEn] = useState(attribute?.labelEn ?? '');
  const [unit, setUnit] = useState(attribute?.unit ?? '');
  const [helpText, setHelpText] = useState(attribute?.helpText ?? '');
  const [min, setMin] = useState(numText(attribute?.validation.min));
  const [max, setMax] = useState(numText(attribute?.validation.max));
  const [maxLength, setMaxLength] = useState(numText(attribute?.validation.maxLength));
  const [flags, setFlags] = useState<Record<Flag, boolean>>({
    isFilterable: attribute?.isFilterable ?? false,
    isSearchable: attribute?.isSearchable ?? false,
  });
  const [options, setOptions] = useState<OptionRow[]>(
    attribute?.options.map((o) => ({ key: `o${o.id}`, id: o.id, code: o.code, labelFa: o.labelFa, labelEn: o.labelEn ?? '' })) ??
      [],
  );

  const numeric = NUMERIC_TYPES.includes(dataType);
  const text = TEXT_TYPES.includes(dataType);
  const withOptions = OPTION_TYPES.includes(dataType);
  const filterable = FILTERABLE_TYPES.includes(dataType);

  function setOption(i: number, patch: Partial<OptionRow>) {
    setOptions((list) => list.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  }

  /** '' → undefined; anything that isn't a number → null (error) */
  function parse(value: string): number | undefined | null {
    if (!value.trim()) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = numeric
      ? { min: parse(min), max: parse(max) }
      : text
        ? { maxLength: parse(maxLength) }
        : {};
    // quick checks before the round trip; code formats are checked by the API (one place for those rules)
    const problem =
      labelFa.trim().length < 2
        ? 'عنوان فارسی ویژگی را وارد کنید.'
        : Object.values(validation).includes(null)
          ? 'حداقل، حداکثر و طول باید عدد باشند.'
          : withOptions && !options.length
            ? 'دست‌کم یک گزینه اضافه کنید.'
            : withOptions && options.some((o) => !o.code.trim() || !o.labelFa.trim())
              ? 'کد و عنوان فارسی همه‌ی گزینه‌ها را وارد کنید.'
              : '';
    if (problem) {
      form.setError(problem);
      return;
    }

    const body = {
      ...(!editing && { code: code.trim(), dataType }),
      labelFa,
      labelEn,
      unit: numeric ? unit : '',
      helpText,
      validation,
      ...flags,
      isFilterable: flags.isFilterable && filterable,
      options: withOptions ? options.map(({ id, code, labelFa, labelEn }) => ({ id, code, labelFa, labelEn })) : [],
    };
    await (editing
      ? form.send('PUT', `/catalog/attributes/${attribute!.id}`, body, 'تغییرات ویژگی ذخیره شد.')
      : form.send('POST', '/catalog/attributes', body, 'ویژگی جدید ساخته شد.'));
  }

  async function onDelete() {
    await form.send('DELETE', `/catalog/attributes/${attribute!.id}`, undefined, `ویژگی «${attribute!.labelFa}» حذف شد.`, {
      title: 'حذف ویژگی',
      message: `ویژگی «${attribute!.labelFa}» و گزینه‌هایش حذف شود؟ این کار برگشت‌پذیر نیست.`,
    });
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{form.error}</FormError>

      <div className={css.twoCols}>
        <Field label="عنوان فارسی" htmlFor="labelFa" required>
          <Input id="labelFa" value={labelFa} onChange={(e) => setLabelFa(e.target.value)} />
        </Field>
        <Field label="عنوان انگلیسی" htmlFor="labelEn">
          <Input id="labelEn" ltr value={labelEn} onChange={(e) => setLabelEn(e.target.value)} />
        </Field>
      </div>

      <Field
        label="کد"
        htmlFor="code"
        required={!editing}
        hint={editing ? 'کد بعد از ساخت قابل تغییر نیست.' : 'برای API، ایمپورت و جستجو؛ مثل thickness_mm. بعداً قابل تغییر نیست.'}
      >
        <Input id="code" ltr readOnly={editing} value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} />
      </Field>

      <Field label="نوع مقدار" htmlFor="dataType" required hint={editing ? 'نوع بعد از ساخت قابل تغییر نیست.' : undefined}>
        <Select
          id="dataType"
          value={dataType}
          disabled={editing}
          onChange={(e) => setDataType(e.target.value as AttributeType)}
        >
          {ADMIN_ATTRIBUTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      {numeric && (
        <>
          <Field label="واحد" htmlFor="unit" hint="همه‌ی مقدارها با همین واحد ذخیره می‌شوند؛ مثل mm، g، V یا ماه.">
            <Input id="unit" value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} />
          </Field>
          <div className={css.twoCols}>
            <Field label="حداقل مقدار" htmlFor="min">
              <Input id="min" ltr type="number" step="any" value={min} onChange={(e) => setMin(e.target.value)} />
            </Field>
            <Field label="حداکثر مقدار" htmlFor="max">
              <Input id="max" ltr type="number" step="any" value={max} onChange={(e) => setMax(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {text && (
        <Field label="حداکثر طول (کاراکتر)" htmlFor="maxLength">
          <Input id="maxLength" ltr type="number" min={1} value={maxLength} onChange={(e) => setMaxLength(e.target.value)} />
        </Field>
      )}

      {withOptions && (
        <Fieldset legend="گزینه‌ها (به همین ترتیب نمایش داده می‌شوند)">
          {options.map((o, i) => (
            <div key={o.key} className={css.optionRow}>
              <Input
                aria-label={`عنوان فارسی گزینه‌ی ${i + 1}`}
                placeholder="عنوان فارسی"
                value={o.labelFa}
                onChange={(e) => setOption(i, { labelFa: e.target.value })}
              />
              <Input
                aria-label={`عنوان انگلیسی گزینه‌ی ${i + 1}`}
                placeholder="English"
                ltr
                value={o.labelEn}
                onChange={(e) => setOption(i, { labelEn: e.target.value })}
              />
              <Input
                className={css.optionCode}
                aria-label={`کد گزینه‌ی ${i + 1}`}
                placeholder="code"
                ltr
                readOnly={Boolean(o.id)}
                title={o.id ? 'کد گزینه بعد از ساخت قابل تغییر نیست' : undefined}
                value={o.code}
                onChange={(e) => setOption(i, { code: e.target.value.toLowerCase() })}
              />
              <OrderButtons
                index={i}
                count={options.length}
                onMove={(d) => setOptions((list) => moveItem(list, i, d))}
                onRemove={() => setOptions((list) => list.filter((_, j) => j !== i))}
                removeLabel="حذف گزینه"
              />
            </div>
          ))}
          <Button
            size="sm"
            className={css.addButton}
            onClick={() => setOptions((list) => [...list, { key: newKey(), code: '', labelFa: '', labelEn: '' }])}
          >
            + افزودن گزینه
          </Button>
          <Hint>کد هر گزینه (مثل front) برای ایمپورت و جستجو است و بعد از ذخیره قابل تغییر نیست.</Hint>
        </Fieldset>
      )}

      <Field label="راهنما" htmlFor="helpText" hint="زیر این فیلد در فرم محصول نمایش داده می‌شود.">
        <Textarea id="helpText" maxLength={300} value={helpText} onChange={(e) => setHelpText(e.target.value)} />
      </Field>

      <Fieldset legend="فیلتر و جستجو">
        {FLAGS.map((f) => {
          const disabled = f.key === 'isFilterable' && !filterable;
          return (
            <Checkbox
              key={f.key}
              label={f.label}
              hint={disabled ? 'برای متن و تاریخ ممکن نیست.' : 'hint' in f ? f.hint : undefined}
              checked={flags[f.key] && !disabled}
              disabled={disabled}
              onChange={(e) => setFlags((s) => ({ ...s, [f.key]: e.target.checked }))}
            />
          );
        })}
      </Fieldset>

      {editing && (
        <Hint>
          {sets.length ? (
            <>
              در مجموعه‌های:{' '}
              {sets.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && '، '}
                  <Link href={`/admin/catalog/attribute-sets/${s.id}`}>{s.name}</Link>
                </span>
              ))}
            </>
          ) : (
            'این ویژگی هنوز در هیچ مجموعه‌ای نیست.'
          )}
        </Hint>
      )}

      <FormActions>
        <Button type="submit" variant="primary" loading={form.busy === 'save'} disabled={form.busy !== ''}>
          {form.busy === 'save' ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت ویژگی'}
        </Button>
        <Button href={LIST}>انصراف</Button>
        {editing && (
          <>
            <Spacer />
            <Button
              variant="danger"
              onClick={onDelete}
              loading={form.busy === 'delete'}
              disabled={form.busy !== '' || sets.length > 0}
              title={sets.length ? 'اول ویژگی را از مجموعه‌ها بردارید' : undefined}
            >
              حذف ویژگی
            </Button>
          </>
        )}
      </FormActions>
    </Form>
  );
}
