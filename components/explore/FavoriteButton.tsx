'use client'
import { useState } from 'react'
export function FavoriteButton({profileId,initial=false}:{profileId:string;initial?:boolean}){const [fav,setFav]=useState(initial);const t=async()=>{await fetch('/api/favorites',{method:fav?'DELETE':'POST',headers:{'content-type':'application/json'},body:JSON.stringify({profile_id:profileId})});setFav(!fav)};return <button className='btn-secondary' onClick={t}>{fav?'Quitar guardado':'Guardar candidato'}</button>}
