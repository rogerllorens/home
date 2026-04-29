const m=new Map<string,{count:number;ts:number}>()
export function rateLimit(key:string,limit=20,windowMs=60000){const now=Date.now();const e=m.get(key);if(!e||now-e.ts>windowMs){m.set(key,{count:1,ts:now});return true}if(e.count>=limit)return false;e.count++;return true}
