'use client'
import { useFormStatus } from 'react-dom'
export function LoadingButton({label}:{label:string}){const {pending}=useFormStatus();return <button className='btn-primary' disabled={pending}>{pending?'Guardando...':label}</button>}
