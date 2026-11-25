// The admin panel's own UI kit (Ant Design was tried and rejected — PROJECT-NOTES §2).
// Every panel page is built from these; colors are tokens in styles/global.css.
export { Button, Card, cx, EmptyState, Icon, PageHeader, StatusBadge, type Crumb, type IconName, type Tone } from './base';
export {
  DataTable,
  Pagination,
  queryHref,
  readTableState,
  sortAndPage,
  type Column,
  type SearchParams,
  type TableState,
} from './DataTable';
export {
  Checkbox,
  Field,
  FieldControl,
  Fieldset,
  FieldTabs,
  Form,
  FormActions,
  FormError,
  Hint,
  Input,
  moveItem,
  OrderButtons,
  Select,
  Spacer,
  Tabs,
  Textarea,
  useFieldTabs,
  type FieldSpec,
  type FieldTab,
  type Tab,
  type TabField,
  type UploadImage,
} from './form';
export { UiProvider, useConfirm, useToast, type ConfirmOptions } from './UiProvider';
