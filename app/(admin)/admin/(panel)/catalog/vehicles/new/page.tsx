import Forbidden from '@admin/components/Forbidden';
import VehicleForm from '@admin/components/catalog/VehicleForm';
import { PageHeader } from '@admin/components/ui';
import { adminGet } from '@admin/lib/api';
import { adminPage } from '@admin/lib/auth';
import type { Vehicle } from '@admin/lib/vehicles';
export default async function NewVehicle() {
  const page = await adminPage('/admin/catalog/vehicles');
  if (!page) return <Forbidden />;
  const [known, makes] = await Promise.all([
    adminGet<Vehicle[]>('/catalog/vehicles'),
    adminGet<string[]>('/catalog/vehicles/makes'),
  ]);
  return (
    <>
      <PageHeader title="افزودن نسخه خودرو" crumbs={page.subCrumbs} />
      <VehicleForm known={known} makes={makes} />
    </>
  );
}
