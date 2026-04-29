'use client'
import { useEffect } from 'react'
export function RegisterView({profileId}:{profileId:string}){useEffect(()=>{fetch('/api/profile/view',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({profile_id:profileId})})},[profileId]);return null}
