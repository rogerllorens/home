export function PlanBadge({plan}:{plan:string}){return <span className='px-2 py-1 rounded-full bg-rose text-burgundy text-xs'>{plan==='pro'?'Plan Pro':'Plan Gratis'}</span>}
