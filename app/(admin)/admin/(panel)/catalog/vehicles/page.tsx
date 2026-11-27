import Forbidden from '@admin/components/Forbidden';
import { Button, Card, DataTable, PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { vehicleName, vehicleStates, type Vehicle } from '@admin/lib/vehicles';
const href = '/admin/catalog/vehicles';
export default async function VehiclesPage() {
  const page = await adminPage(href);
  if (!page) return <Forbidden />;
  const rows = await adminGet<Vehicle[]>('/catalog/vehicles');
  return (
    <>
      <PageHeader
        title={page.title}
        crumbs={page.crumbs}
        actions={
          <Button href={href + '/new'} variant="primary">
            افزودن نسخه خودرو
          </Button>
        }
      />
      <Card flush>
        <DataTable
          rows={rows}
          rowKey={(v) => v.id}
          empty="نسخه خودرویی ثبت نشده است."
          columns={[
            { key: 'name', title: 'نسخه فنی', link: (v) => href + '/' + v.id, render: vehicleName },
            { key: 'status', title: 'وضعیت', render: (v) => vehicleStates[v.status] },
          ]}
        />
      </Card>
    </>
  );
}
