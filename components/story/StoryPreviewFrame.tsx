import { StoryCanvas } from './StoryCanvas'
import { StoryTemplateId } from './story-types'
export function StoryPreviewFrame(props:{data:any;template:StoryTemplateId;showWatermark:boolean;url:string}){return <div className='card flex justify-center'><StoryCanvas {...props}/></div>}
