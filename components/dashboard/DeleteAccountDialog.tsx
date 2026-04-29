'use client'
export function DeleteAccountDialog(){return <form action='/api/profile/delete' method='post' className='card'><p className='mb-3'>Esto eliminará tu cuenta y datos asociados.</p><button className='btn-primary'>Borrar cuenta</button></form>}
