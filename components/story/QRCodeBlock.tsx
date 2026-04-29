import { QRCodeSVG } from 'qrcode.react'
export function QRCodeBlock({url}:{url:string}){return <div className='bg-white/90 rounded-xl p-3 text-center'><QRCodeSVG value={url} size={130}/><p className='text-xs mt-2'>Escanéame para solicitar entrevista</p></div>}
