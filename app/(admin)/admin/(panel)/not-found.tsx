import { Button, Card, EmptyState, PageHeader } from '@admin/components/ui';

export default function AdminNotFound() {
  return (
    <>
      <PageHeader title="صفحه پیدا نشد" />
      <Card flush>
        <EmptyState
          icon="search"
          title="این صفحه در پنل وجود ندارد."
          text="ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد."
          action={<Button href="/admin">بازگشت به داشبورد</Button>}
        />
      </Card>
    </>
  );
}
