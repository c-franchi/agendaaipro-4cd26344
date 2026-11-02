// Stripe period boundaries are item-level on Basil and later. Never infer validity from order dates or voucher duration.
export function subscriptionSummary(sub: any) {
 const periods=(sub.items?.data||[]).map((item:any)=>item.current_period_end).filter((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0);
 const end=periods.length?Math.min(...periods):sub.current_period_end;
 const timestamp=typeof end==='number'&&Number.isFinite(end)&&end>0?end:null;
 const cutoff=typeof sub.cancel_at==='number'&&sub.cancel_at>0?sub.cancel_at:null;
 return {status:String(sub.status||'unknown'),currentPeriodEnd:timestamp?new Date(Math.min(timestamp,cutoff||timestamp)*1000).toISOString():null,cancelAtPeriodEnd:Boolean(sub.cancel_at_period_end||cutoff),endedAt:typeof sub.ended_at==='number'?new Date(sub.ended_at*1000).toISOString():null};
}
