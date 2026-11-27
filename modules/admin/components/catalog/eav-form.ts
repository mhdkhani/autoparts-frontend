import type { EavField, EavForm, EavValues } from '@admin/lib/types';
import type { FieldSpec, FieldTab } from '../ui';

/**
 * The input for a category attribute, from its type. Values with a format pattern are English keys (url_key), so
 * they are typed left-to-right; an optional select gets an empty first choice.
 */
function fieldOf(f: EavField): FieldSpec {
  if (f.isWysiwyg) return { type: 'editor' };
  switch (f.dataType) {
    case 'textarea':
      return { type: 'textarea', maxLength: f.validation.maxLength };
    case 'text':
    case 'image':
      return { type: f.dataType, maxLength: f.validation.maxLength, ltr: Boolean(f.validation.pattern) };
    case 'boolean':
      if (f.code === 'is_active' && f.isRequired) return { type: 'boolean' };
      return { type: 'select', placeholder: '— انتخاب نشده —', options: [{ value: '1', label: 'بله' }, { value: '0', label: 'خیر' }] };
    case 'int':
    case 'decimal':
    case 'date':
      return { type: f.dataType, min: f.validation.min, max: f.validation.max };
    case 'multiselect':
    case 'select':
      return {
        type: f.dataType,
        options: f.options.map((o) => ({ value: o.code, label: o.labelFa })),
        placeholder: '— انتخاب کنید —',
      };
    default:
      throw new Error(`Attribute "${f.code}" has type "${f.dataType}", which the form doesn't support`);
  }
}

/** The attribute set as form tabs: each group a tab, each attribute a field keyed by its code. */
export const tabsOf = (eav: EavForm): FieldTab[] =>
  eav.groups.map((g) => ({
    key: String(g.id),
    label: g.name,
    fields: g.fields.map((f) => ({ key: f.code, label: f.unit ? `${f.labelFa} (${f.unit})` : f.labelFa, field: fieldOf(f), required: f.isRequired, hint: f.helpText ?? undefined })),
  }));

/** A value as the form edits it (a string): booleans '1' / '0', a select its option code, no value ''. */
export function formValue(f: EavField, v: EavValues[string] | undefined): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join('\n');
  if (f.dataType === 'boolean') return v ? '1' : '0';
  return String(v);
}
