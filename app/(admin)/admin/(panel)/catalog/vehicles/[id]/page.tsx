import Forbidden from '@admin/components/Forbidden';
import VehicleForm from '@admin/components/catalog/VehicleForm';
import { Card, DataTable, PageHeader } from '@admin/components/ui';
import { adminGet, idParam } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import { fitmentStates, vehicleName, type Vehicle } from '@admin/lib/vehicles';
export default async function EditVehicle({ params }: { params: Promise<{ id: string }> }) {
  const page = await adminPage('/admin/catalog/vehicles');
  if (!page) return <Forbidden />;
  const id = idParam((await params).id);
  const [{ vehicle, products }, known, makes] = await Promise.all([
    adminGet<{ vehicle: Vehicle; products: { id: number; sku: string; status: string }[] }>('/catalog/vehicles/' + id),
    adminGet<Vehicle[]>('/catalog/vehicles'),
    adminGet<string[]>('/catalog/vehicles/makes'),
  ]);
  return (
    <>
      <PageHeader title={vehicleName(vehicle)} crumbs={page.subCrumbs} />
      <VehicleForm vehicle={vehicle} known={known} makes={makes} />
      <Card title="تطابق‌های ثبت‌شده برای این نسخه">
        <DataTable
          rows={products}
          rowKey={(r) => r.id}
          empty="تطابقی ثبت نشده است."
          columns={[
            { key: 'sku', title: 'شناسه فروش', link: (r) => '/admin/catalog/products/' + r.id },
            { key: 'status', title: 'تطابق', render: (r) => fitmentStates[r.status] },
          ]}
        />
      </Card>
    </>
  );
}
