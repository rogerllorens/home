export async function sendJobCompletedEmail(user: { email?: string | null }, job: { id: string }, downloads: unknown[]) {
  console.info(`[email:mock] Job completed email would be sent to ${user.email ?? "unknown"} for ${job.id} with ${downloads.length} downloads.`);
}
export async function sendJobFailedEmail(user: { email?: string | null }, job: { id: string }, error: string) {
  console.info(`[email:mock] Job failed email would be sent to ${user.email ?? "unknown"} for ${job.id}: ${error}`);
}
