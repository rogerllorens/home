export function assertOwned(record: { user_id?: string | null } | null | undefined, userId: string) {
  if (!record) throw new Error("not_found");
  if (record.user_id !== userId) throw new Error("forbidden");
}
export const canRegenerateProposal = () => true;
export const canApproveProposal = () => true;
export const canExportApproved = () => true;
