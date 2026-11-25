'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAdminForm } from '@admin/lib/client-api';
import { attributeTypeLabel, type AttributeListItem, type AttributeSet } from '@admin/lib/types';
import {
  Button,
  Card,
  Checkbox,
  Field,
  FormActions,
  FormError,
  Hint,
  Input,
  moveItem,
  OrderButtons,
  Select,
  Spacer,
} from '../ui';
import ui from '../ui/ui.module.css';
import css from './catalog.module.css';

const LIST = '/admin/catalog/attribute-sets';

type Item = { attributeId: number; isRequired: boolean };
type Group = { key: string; name: string; items: Item[] };

let nextKey = 0;
const newKey = () => `g${++nextKey}`;

/**
 * «افزودن / ویرایش مجموعه‌ی ویژگی»: name, groups (ordered) and each group's attributes (ordered, required or not).
 * Nothing is saved until «ذخیره»; the whole set is sent at once.
 */
export default function AttributeSetForm({
  attributes,
  set,
  copyFrom,
  canManageAttributes,
}: {
  /** every attribute (to pick from) */
  attributes: AttributeListItem[];
  /** edit mode when given */
  set?: AttributeSet;
  /** new set prefilled from this one («کپی») */
  copyFrom?: AttributeSet;
  /** show the «ویژگی جدید» link */
  canManageAttributes: boolean;
}) {
  const form = useAdminForm(LIST);
  const editing = Boolean(set);
  const source = set ?? copyFrom;
  const [name, setName] = useState(set?.name ?? (copyFrom ? `${copyFrom.name} (کپی)` : ''));
  const [groups, setGroups] = useState<Group[]>(() =>
    source
      ? source.groups.map((g) => ({ key: newKey(), name: g.name, items: g.attributes }))
      : [{ key: newKey(), name: 'عمومی', items: [] }],
  );

  const byId = new Map(attributes.map((a) => [a.id, a]));
  const used = new Set(groups.flatMap((g) => g.items.map((i) => i.attributeId)));
  const free = attributes.filter((a) => !used.has(a.id)).sort((a, b) => a.labelFa.localeCompare(b.labelFa, 'fa'));

  const setGroup = (gi: number, patch: Partial<Group>) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setItems = (gi: number, update: (items: Item[]) => Item[]) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, items: update(g.items) } : g)));

  function moveToGroup(from: number, index: number, to: number) {
    setGroups((gs) => {
      const item = gs[from].items[index];
      return gs.map((g, i) =>
        i === from ? { ...g, items: g.items.filter((_, j) => j !== index) } : i === to ? { ...g, items: [...g.items, item] } : g,
      );
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const names = groups.map((g) => g.name.trim());
    const problem =
      name.trim().length < 2
        ? 'نام مجموعه را وارد کنید.'
        : !groups.length
          ? 'مجموعه دست‌کم یک گروه لازم دارد.'
          : names.some((n) => !n)
            ? 'نام همه‌ی گروه‌ها را وارد کنید.'
            : new Set(names).size !== names.length
              ? 'نام گروه‌ها نباید تکراری باشد.'
              : '';
    if (problem) {
      form.setError(problem);
      return;
    }
    const body = { name, groups: groups.map((g) => ({ name: g.name, attributes: g.items })) };
    await (editing
      ? form.send('PUT', `/catalog/attribute-sets/${set!.id}`, body, 'تغییرات مجموعه ذخیره شد.')
      : form.send('POST', '/catalog/attribute-sets', body, 'مجموعه‌ی جدید ساخته شد.'));
  }

  async function onDelete() {
    await form.send('DELETE', `/catalog/attribute-sets/${set!.id}`, undefined, `مجموعه‌ی «${set!.name}» حذف شد.`, {
      title: 'حذف مجموعه‌ی ویژگی',
      message: `مجموعه‌ی «${set!.name}» حذف شود؟ خود ویژگی‌ها حذف نمی‌شوند.`,
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className={css.editor}>
      <FormError>{form.error}</FormError>

      <Card>
        <Field
          label="نام مجموعه"
          htmlFor="name"
          required
          hint="معمولاً نام یک نوع قطعه، مثل «لنت ترمز» یا «روغن موتور». فرم و جدول مشخصات محصولات این نوع از این مجموعه ساخته می‌شود."
        >
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </Card>

      {groups.map((g, gi) => (
        <Card key={g.key} flush>
          <div className={css.groupHead}>
            <Input
              className={css.groupName}
              aria-label={`نام گروه ${gi + 1}`}
              placeholder="نام گروه، مثل «ابعاد»"
              value={g.name}
              onChange={(e) => setGroup(gi, { name: e.target.value })}
            />
            <Spacer />
            <OrderButtons
              index={gi}
              count={groups.length}
              onMove={(d) => setGroups((gs) => moveItem(gs, gi, d))}
              onRemove={() => setGroups((gs) => gs.filter((_, i) => i !== gi))}
              removeLabel="حذف گروه (ویژگی‌هایش از مجموعه خارج می‌شوند)"
            />
          </div>

          <div className={css.items}>
            {g.items.length === 0 && <Hint>هنوز ویژگی‌ای در این گروه نیست.</Hint>}
            {g.items.map((item, ii) => {
              const a = byId.get(item.attributeId);
              return (
                <div key={item.attributeId} className={css.item}>
                  <div className={css.itemName}>
                    {a ? (
                      <>
                        {a.labelFa}
                        <span className={css.code} dir="ltr">
                          {a.code}
                        </span>
                        <span className={ui.muted}>
                          {' '}
                          · {attributeTypeLabel(a.dataType)}
                          {a.unit && ` (${a.unit})`}
                        </span>
                      </>
                    ) : (
                      <span className={ui.muted}>ویژگی {item.attributeId} (حذف شده)</span>
                    )}
                  </div>
                  <Checkbox
                    className={css.inlineCheck}
                    label="اجباری"
                    checked={item.isRequired}
                    onChange={(e) =>
                      setItems(gi, (items) => items.map((x, j) => (j === ii ? { ...x, isRequired: e.target.checked } : x)))
                    }
                  />
                  {groups.length > 1 && (
                    <Select
                      className={css.small}
                      aria-label="انتقال به گروه"
                      value={gi}
                      onChange={(e) => moveToGroup(gi, ii, Number(e.target.value))}
                    >
                      {groups.map((x, i) => (
                        <option key={x.key} value={i}>
                          {i === gi ? `گروه: ${x.name || '—'}` : `انتقال به: ${x.name || '—'}`}
                        </option>
                      ))}
                    </Select>
                  )}
                  <OrderButtons
                    index={ii}
                    count={g.items.length}
                    onMove={(d) => setItems(gi, (items) => moveItem(items, ii, d))}
                    onRemove={() => setItems(gi, (items) => items.filter((_, j) => j !== ii))}
                    removeLabel="برداشتن از مجموعه"
                  />
                </div>
              );
            })}
          </div>

          <Select
            className={css.addAttribute}
            aria-label={`افزودن ویژگی به گروه ${g.name}`}
            value=""
            disabled={!free.length}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) setItems(gi, (items) => [...items, { attributeId: id, isRequired: false }]);
            }}
          >
            <option value="">{free.length ? '+ افزودن ویژگی به این گروه…' : 'همه‌ی ویژگی‌ها در مجموعه هستند'}</option>
            {free.map((a) => (
              <option key={a.id} value={a.id}>
                {a.labelFa} — {a.code}
              </option>
            ))}
          </Select>
        </Card>
      ))}

      <Button onClick={() => setGroups((gs) => [...gs, { key: newKey(), name: '', items: [] }])}>+ گروه جدید</Button>
      {canManageAttributes && (
        <Hint>
          ویژگی موردنظر در فهرست نیست؟ <Link href="/admin/catalog/attributes/new">ساخت ویژگی جدید</Link>
        </Hint>
      )}

      <FormActions>
        <Button type="submit" variant="primary" loading={form.busy === 'save'} disabled={form.busy !== ''}>
          {form.busy === 'save' ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت مجموعه'}
        </Button>
        <Button href={LIST}>انصراف</Button>
        {editing && (
          <>
            <Spacer />
            <Button variant="danger" onClick={onDelete} loading={form.busy === 'delete'} disabled={form.busy !== ''}>
              حذف مجموعه
            </Button>
          </>
        )}
      </FormActions>
    </form>
  );
}
