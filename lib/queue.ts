import type { RequestItem } from './types';
export function advanceQueue(items:RequestItem[],maxActive:number,enabled=true){const next=items.map(r=>({...r}));if(!enabled)return next;let slots=Math.max(0,maxActive-next.filter(r=>r.status==='in_progress').length);for(const r of next.filter(r=>r.status==='queued').sort((a,b)=>a.position-b.position)){if(!slots)break;r.status='in_progress';slots--}return next}
export function entitled(status:string,end:string|null,now=Date.now()){return ['active','trialing'].includes(status)&&!!end&&new Date(end).getTime()>now}
