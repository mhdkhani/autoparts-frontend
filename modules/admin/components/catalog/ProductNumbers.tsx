'use client';

import { useState } from 'react';
import type { NumberEvidence, NumberLink, NumberRelation, PartNumber, ProductChoices, ProductNumbers as Saved } from '@admin/lib/types';
import { Button, Field, Fieldset, Input, Select } from '../ui';
import css from './catalog.module.css';

const blank = (brandId?: number): PartNumber => ({numberType:'mpn', raw:'', productBrandId:brandId});
type DraftLink = NumberLink & { key: number };
type DraftRelation = NumberRelation & { key: number; dirty: boolean };

/** Stable local keys keep a relation anchored to its number when another row is removed. */
export function useProductNumbers(saved?: Saved) {
  const [links, setLinks] = useState<DraftLink[]>(() => (saved?.links ?? []).map((l,key) => ({...l,key})));
  const [edges, setEdges] = useState<DraftRelation[]>(() => (saved?.relations ?? []).map((e,key) => ({...e,key,dirty:false})));
  const [removed, setRemoved] = useState<{id: number; version: string}[]>([]);
  const [next, setNext] = useState(Math.max(links.length,edges.length));
  function key() { setNext(next+1); return next; }

  function removeLink(k: number) {
    setLinks(ls => ls.filter(l => l.key !== k));
    // Detaching a number from a SKU leaves its shared catalog relations intact.
    setEdges(es => es.filter(e => e.anchor !== k));
  }
  function removeEdge(e: DraftRelation) {
    if (e.id && e.version) setRemoved(r => [...r,{id:e.id!,version:e.version!}]);
    setEdges(es => es.filter(x => x.key !== e.key));
  }
  function changeEdge(k: number, change: Partial<NumberRelation>) {
    setEdges(es => es.map(e => e.key === k ? {...e,...change,dirty:true} : e));
  }
  function payload() {
    return {
      links: links.map(({number,status,source,key}) => ({number:wire(number,saved?.links[key]?.number),status,source})),
      relations: edges.filter(e => e.dirty).map(({key: _key,dirty: _dirty,anchor,other,...e}) =>
        ({...e, other:wire(other,saved?.relations.find(r => r.id === e.id)?.other), anchor:links.findIndex(l => l.key === anchor)})), removed,
    };
  }
  return {links,edges,removeLink,removeEdge,changeEdge,payload,
    addLink:(brandId: number) => setLinks([...links,{key:key(),number:blank(brandId),status:'pending'}]),
    changeLink:(k: number,change: Partial<NumberLink>) => setLinks(ls => ls.map(l => l.key === k ? {...l,...change} : l)),
    addEdge:(anchor: number) => setEdges([...edges,{key:key(),anchor,other:blank(),status:'pending',kind:'equivalent',incoming:false,dirty:true}]),
  };
}

function wire(n: PartNumber, initial?: PartNumber): PartNumber {
  const displayChange = initial?.id && n.raw.trim() !== initial.raw ? {originalId:initial.id,originalRaw:initial.raw} : {};
  return n.numberType === 'mpn' ? {...displayChange,numberType:n.numberType,raw:n.raw,productBrandId:n.productBrandId} :
    {...displayChange,numberType:n.numberType,raw:n.raw,make:n.make};
}

function NumberFields({value:n,onChange,choices,prefix,brandId}: {
  value:PartNumber; onChange:(n:PartNumber)=>void; choices:ProductChoices; prefix:string; brandId?:number;
}) {
  return <div className={css.twoCols}>
    <Field label="نوع شماره" htmlFor={prefix+'-type'}><Select id={prefix+'-type'} value={n.numberType}
      onChange={e=>onChange({raw:n.raw,numberType:e.target.value as PartNumber['numberType'],productBrandId:brandId})}>
      <option value="mpn">شماره سازنده (MPN)</option><option value="oem">مرجع خودروساز (OEM)</option>
    </Select></Field>
    <Field label="شماره فنی" htmlFor={prefix+'-raw'}><Input ltr id={prefix+'-raw'} maxLength={160} value={n.raw}
      onChange={e=>onChange({...n,raw:e.target.value})}/></Field>
    {n.numberType==='mpn' ? <Field label="برند صادرکننده قطعه" htmlFor={prefix+'-brand'}><Select id={prefix+'-brand'}
      value={n.productBrandId ?? ''} onChange={e=>onChange({...n,productBrandId:Number(e.target.value)})}>
      <option value="">— انتخاب کنید —</option>{choices.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
    </Select></Field> : <Field label="برند خودرو" htmlFor={prefix+'-make'} hint="انتخاب کنید یا نام برند جدید را بنویسید.">
      <Input id={prefix+'-make'} list="vehicle-makes" value={n.make ?? ''} maxLength={160}
        onChange={e=>onChange({...n,make:e.target.value})}/></Field>}
  </div>;
}

function Evidence({row,onChange,prefix}:{row:NumberEvidence;onChange:(e:Partial<NumberEvidence>)=>void;prefix:string}) {
  return <div className={css.twoCols}>
    <Field label="وضعیت تأیید" htmlFor={prefix+'-status'}><Select id={prefix+'-status'} value={row.status}
      onChange={e=>onChange({status:e.target.value as NumberEvidence['status']})}>
      <option value="pending">در انتظار بررسی</option><option value="verified">تأییدشده</option>
    </Select></Field>
    <Field label="منبع" htmlFor={prefix+'-source'} required={row.status==='verified'}>
      <Input id={prefix+'-source'} value={row.source ?? ''} onChange={e=>onChange({source:e.target.value})}/>
    </Field>
  </div>;
}

export default function ProductNumbers({model:m,choices,brandId}: {
  model:ReturnType<typeof useProductNumbers>; choices:ProductChoices; brandId:number;
}) {
  return <Fieldset legend="شماره‌های فنی محصول">
    <datalist id="vehicle-makes">{choices.makes.map(v=><option key={v.name} value={v.name}/>)}</datalist>
    {m.links.length > 0 && <p>اصلاح فاصله و خط تیره، شکل نمایشی همان شماره را در کل کاتالوگ تغییر می‌دهد. تغییر کد یا صادرکننده، اتصال محصول را به شمارهٔ دیگری منتقل می‌کند؛ روابط قبلی روی شمارهٔ قبلی می‌مانند مگر اینکه خود رابطه را هم ویرایش کنید.</p>}
    {m.links.map(l=>{
      const prefix='number-'+l.key;
      return <Fieldset key={l.key} legend={l.number.raw || 'شماره جدید'}>
        <NumberFields value={l.number} choices={choices} prefix={prefix} brandId={brandId} onChange={number=>m.changeLink(l.key,{number})}/>
        <Evidence row={l} prefix={prefix} onChange={change=>m.changeLink(l.key,change)}/>
        <Button type="button" onClick={()=>m.removeLink(l.key)}>برداشتن شماره از محصول</Button>
        {m.edges.filter(e=>e.anchor===l.key).map(e=>{
          const id='relation-'+e.key;
          return <Fieldset key={e.key} legend="رابطه‌ی مشترک شماره">
            <Field label="ارتباط با شماره‌ی دیگر" htmlFor={id+'-kind'} hint="تغییر این رابطه برای تمام محصولاتی که این شماره را دارند اعمال می‌شود.">
              <Select id={id+'-kind'} value={e.kind==='equivalent'?'equivalent':e.incoming?'previous':'next'}
                onChange={ev=>m.changeEdge(e.key,{kind:ev.target.value==='equivalent'?'equivalent':'supersession',incoming:ev.target.value==='previous'})}>
                <option value="equivalent">شماره‌ی دیگر معادل این شماره است</option>
                <option value="next">شماره‌ی دیگر جانشین این شماره شده</option>
                <option value="previous">این شماره جانشین شماره‌ی دیگر شده</option>
              </Select></Field>
            <NumberFields value={e.other} prefix={id} choices={choices} onChange={other=>m.changeEdge(e.key,{other})}/>
            <Evidence row={e} prefix={id} onChange={change=>m.changeEdge(e.key,change)}/>
            <Button type="button" onClick={()=>m.removeEdge(e)}>حذف رابطه از کاتالوگ</Button>
          </Fieldset>;
        })}
        <Button type="button" onClick={()=>m.addEdge(l.key)}>افزودن معادل یا جانشین</Button>
      </Fieldset>;
    })}
    <Button type="button" onClick={()=>m.addLink(brandId)}>افزودن شماره فنی</Button>
  </Fieldset>;
}
