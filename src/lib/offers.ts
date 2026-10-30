import {useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {PLANS,type PlanKey} from '@/lib/constants';
export const offerDb=supabase as unknown as SupabaseClient;
export type Promotion={plan_type:PlanKey;title:string;setup_cents:number;monthly_cents:number;starts_at:string;ends_at:string|null;active:boolean;allow_voucher:boolean;updated_at:string};
export type OfferQuote={planType:PlanKey;baseSetupCents:number;baseMonthlyCents:number;setupCents:number;monthlyCents:number;setupDueCents:number;monthlyDueCents:number;fingerprint:string;promotion:Promotion|null;voucher:{code:string;appliesTo:string;months:number;setupDiscountCents:number;monthlyDiscountCents:number}|null};
export function activePromotion(items:Promotion[],plan:PlanKey,now=Date.now()){return items.find(p=>p.plan_type===plan&&p.active&&Date.parse(p.starts_at)<=now&&(!p.ends_at||Date.parse(p.ends_at)>now))||null}
export function usePromotions(){const [items,setItems]=useState<Promotion[]>([]);useEffect(()=>{let alive=true;const read=async()=>{const {data,error}=await offerDb.from('commercial_promotions').select('*');if(alive&&!error)setItems(data||[])};void read();const timer=setInterval(()=>void read(),30000);return()=>{alive=false;clearInterval(timer)}},[]);return items}
export function displayedOffer(items:Promotion[],plan:PlanKey){const promotion=activePromotion(items,plan);return {promotion,setup:promotion?promotion.setup_cents/100:PLANS[plan].setupPrice,monthly:promotion?promotion.monthly_cents/100:PLANS[plan].price}}
export async function quoteOffer(plan:PlanKey,code:string){const {data,error}=await offerDb.rpc('commerce_offer_quote',{p_plan:plan,p_code:code});if(error)throw Error(error.message);return data as OfferQuote}
