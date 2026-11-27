export type Vehicle = {
  groupEn: string | null;
  makeEn: string | null;
  modelEn: string | null;
  modelSlug: string;
  faceliftFrom: string | null;
  faceliftTo: string | null;
  faceliftMarket: string | null;
  fluidRequirements?: Standard[];
  id: number;
  group: string | null;
  makeId: number;
  make: string;
  modelId: number;
  model: string;
  generationId: number;
  generation: string;
  chassis: string | null;
  fromYear: number | null;
  toYear: number | null;
  facelift: string | null;
  trim: string | null;
  engineCode: string | null;
  displacementCc: number | null;
  fuel: string | null;
  aspiration: string | null;
  powerHp: number | null;
  gearboxCode: string | null;
  gearboxType: string | null;
  gears: number | null;
  market: string | null;
  drive: string | null;
  doors: number | null;
  productionFrom: string | null;
  productionTo: string | null;
  modification: string | null;
  framePrefix: string | null;
  source: string | null;
  externalId: string | null;
  status: string;
};
export const vehicleStates: Record<string, string> = { draft: 'پیش‌نویس', reviewed: 'بازبینی‌شده', published: 'منتشرشده' };
export const fitmentStates: Record<string, string> = {
  verified: 'سازگارِ تأییدشده',
  conditional: 'مشروط',
  needs_review: 'نیازمند بررسی',
  incompatible: 'ناسازگار',
  unknown: 'نامعلوم',
};
export type FitmentRule = {
  effect: string;
  fromDate?: string | null;
  toDate?: string | null;
  axle?: string | null;
  side?: string | null;
  steering?: string | null;
  withEquipment?: string | null;
  withoutEquipment?: string | null;
  source?: string | null;
};
export type Fitment = {
  configId: number;
  status: string;
  source?: string | null;
  note?: string | null;
  rules: FitmentRule[];
};
export function vehicleName(v: Vehicle) {
  return [
    v.make,
    v.model,
    v.generation,
    v.chassis,
    v.facelift,
    v.trim,
    v.engineCode,
    v.displacementCc && v.displacementCc + ' cc',
    v.fuel,
    v.aspiration,
    v.powerHp && v.powerHp + ' hp',
    v.gearboxType,
    v.gearboxCode,
    v.gears && v.gears + ' دنده',
    v.drive,
    v.doors && v.doors + ' در',
    v.market,
    v.productionFrom && 'از ' + v.productionFrom,
    v.productionTo && 'تا ' + v.productionTo,
    v.modification,
    v.framePrefix,
    '#' + v.id,
  ]
    .filter(Boolean)
    .join(' · ');
}

export type Standard = {
  issuer: string;
  code: string;
  revision?: string | null;
  source: string;
  application?: string;
  claimType?: string;
};
