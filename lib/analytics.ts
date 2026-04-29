export type EventName='landing_view'|'signup_started'|'signup_completed'|'cv_started'|'cv_completed'|'profile_published'|'public_profile_viewed'|'story_exported'|'share_clicked'|'delete_account_clicked'|'report_submitted'
export function track(event:EventName,payload?:Record<string,unknown>){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('analytics',{detail:{event,payload}})}
