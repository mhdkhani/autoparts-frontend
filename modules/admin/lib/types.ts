// Shapes returned by the backend admin API (backend: src/modules/users/admin).

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  /** set only while the account is locked */
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: number; name: string };
};

export type AdminRole = {
  id: number;
  name: string;
  allPermissions: boolean;
  /** permission keys as stored by the backend (the panel's own list is `Permission` in lib/nav.ts) */
  permissions: string[];
  userCount?: number;
};

export type PermissionInfo = { key: string; group: string; label: string };

// ---------- site settings (backend: src/modules/site-config/config.definition.ts) ----------

export type ConfigField = {
  key: string;
  type: 'text' | 'textarea' | 'image' | 'boolean' | 'select';
  label: string;
  comment?: string;
  default: string;
  maxLength?: number;
  /** checked by the backend on save */
  pattern?: string;
  patternMessage?: string;
  /** left-to-right input */
  ltr?: boolean;
  options?: { value: string; label: string }[];
};

export type ConfigGroup = { key: string; label: string; description?: string; fields: ConfigField[] };
export type ConfigSection = { key: string; category: string; label: string; groups: ConfigGroup[] };
export type ConfigSectionInfo = Pick<ConfigSection, 'key' | 'category' | 'label'>;
/** "<section>/<group>/<field>" → value */
export type ConfigValues = Record<string, string>;

// ---------- catalog › attributes (backend: src/modules/catalog/attributes) ----------
// EAV: every attribute belongs to an entity type (product, category). The panel creates product attributes only;
// category attributes and the category attribute set (its groups = the tabs of the category form) are installed
// with the project.

/** Attribute types with their panel labels (backend list: ATTRIBUTE_TYPES in attribute.schema.ts). */
export const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'متن کوتاه' },
  { value: 'textarea', label: 'متن بلند' },
  { value: 'int', label: 'عدد صحیح' },
  { value: 'decimal', label: 'عدد اعشاری' },
  { value: 'boolean', label: 'بله / خیر' },
  { value: 'date', label: 'تاریخ' },
  { value: 'select', label: 'یک انتخاب از فهرست' },
  { value: 'multiselect', label: 'چند انتخاب از فهرست' },
  { value: 'image', label: 'تصویر' },
] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number]['value'];
export const attributeTypeLabel = (t: AttributeType): string => ATTRIBUTE_TYPES.find((x) => x.value === t)!.label;
/** Types offered when an admin makes a product attribute (backend ADMIN_ATTRIBUTE_TYPES: no `image`). */
export const ADMIN_ATTRIBUTE_TYPES = ATTRIBUTE_TYPES.filter((t) => t.value !== 'image');

// same groups as the backend's attribute.schema.ts
export const OPTION_TYPES: readonly AttributeType[] = ['select', 'multiselect'];
export const NUMERIC_TYPES: readonly AttributeType[] = ['int', 'decimal'];
export const TEXT_TYPES: readonly AttributeType[] = ['text', 'textarea'];
export const FILTERABLE_TYPES: readonly AttributeType[] = ['int', 'decimal', 'boolean', 'select', 'multiselect'];

export type Attribute = {
  id: number;
  code: string;
  labelFa: string;
  labelEn: string | null;
  dataType: AttributeType;
  unit: string | null;
  /** pattern / patternMessage: only on installed attributes (category url_key) */
  validation: { min?: number; max?: number; maxLength?: number; pattern?: string; patternMessage?: string };
  helpText: string | null;
  isFilterable: boolean;
  isSearchable: boolean;
  /** textarea edited with the text editor; the value is HTML (cleaned by the API) */
  isWysiwyg: boolean;
  /** value a new entity starts with ('1' / '0' for booleans, an option code for a select) */
  defaultValue: string | null;
  /** no two entities may share a value (category url_key) */
  isUnique: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AttributeListItem = Attribute & { optionCount: number; setCount: number };
/** `code`: stable English key (fixed after creation) */
export type AttributeOption = { id: number; code: string; labelFa: string; labelEn: string | null };
export type AttributeDetail = Attribute & { options: AttributeOption[] };

/** An attribute as an entity's form uses it: + «required» from the attribute set, + options (select). */
export type EavField = Attribute & { isRequired: boolean; options: AttributeOption[] };
/** An attribute set as a form: groups (the tabs) → fields, in display order. */
export type EavForm = { setId: number; groups: { id: number; name: string; fields: EavField[] }[] };

export type AttributeSetListItem = { id: number; name: string; groupCount: number; attributeCount: number };
export type AttributeSet = {
  id: number;
  name: string;
  groups: { id: number; name: string; attributes: { attributeId: number; isRequired: boolean }[] }[];
};

// ---------- catalog › categories (backend: src/modules/catalog/categories) ----------

/** EAV values of an entity by attribute code; null = no value. */
export type EavValues = Record<string, string | number | boolean | null>;

/** A category: its place in the tree + its attribute values (name, url_key, is_active, …). */
export type Category = { id: number; parentId: number | null; position: number; values: EavValues };

/**
 * The tree in display order (each parent followed by its children, siblings by position) with each category's depth.
 * Used by the list page and the parent dropdown of the form.
 */
/** GET /admin/catalog/categories */
export type CategoriesResponse = { categories: Category[]; form: EavForm };

export function categoryTree(categories: Category[]): { category: Category; depth: number }[] {
  const children = new Map<number | null, Category[]>();
  for (const c of categories) children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
  const out: { category: Category; depth: number }[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const c of (children.get(parentId) ?? []).sort((a, b) => a.position - b.position || a.id - b.id)) {
      out.push({ category: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
