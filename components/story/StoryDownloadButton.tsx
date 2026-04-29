'use client'
import { toPng } from 'html-to-image'
export async function downloadStory(fileName='curriculum-del-amor-story.png'){const node=document.getElementById('story-canvas');if(!node) return;const dataUrl=await toPng(node,{pixelRatio:3,canvasWidth:1080,canvasHeight:1920});const a=document.createElement('a');a.href=dataUrl;a.download=fileName;a.click();return dataUrl}
export function StoryDownloadButton({onDone}:{onDone:(dataUrl:string)=>void}){return <button className='btn-primary' onClick={async()=>{const d=await downloadStory();if(d)onDone(d)}}>Descargar PNG 1080x1920</button>}
