import type { SupabaseClient } from "@supabase/supabase-js";
import { validateChangeSetFields } from "./field-policy";

type BuildArgs = { userId: string; storeId: string; jobId?: string; proposalIds?: string[]; includeFields: string[]; excludeFields?: string[]; title?: string };
type ProposalRow = { id: string; user_id: string; job_id?: string | null; catalog_item_id: string | null; approved_version_id?: string | null; active_version_id?: string | null };
type VersionRow = { id: string; proposal_id: string; content?: Record<string, unknown> | null; proposed_data?: Record<string, unknown> | null; output?: Record<string, unknown> | null; status?: string | null };

const getValue = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => source[key]).find((value) => value !== undefined && value !== null && value !== "");

export function buildProposedShopifyChanges(output: Record<string, unknown>, fields: string[]) {
  const changes: Array<{ fieldPath: string; proposedValue: unknown }> = [];
  for (const fieldPath of fields) {
    if (fieldPath === "seo.title") changes.push({ fieldPath, proposedValue: getValue(output, ["meta_title", "seo_title", "title"] ) });
    else if (fieldPath === "seo.description") changes.push({ fieldPath, proposedValue: getValue(output, ["meta_description", "seo_description", "description"] ) });
    else if (fieldPath === "descriptionHtml" || fieldPath === "bodyHtml") changes.push({ fieldPath, proposedValue: getValue(output, ["descriptionHtml", "bodyHtml", "long_description_html", "long_description", "description"] ) });
    else if (fieldPath === "images.altText") changes.push({ fieldPath, proposedValue: getValue(output, ["image_alt", "primary_image_alt", "alt_text", "gallery_image_alts"] ) });
    else if (fieldPath === "title") changes.push({ fieldPath, proposedValue: getValue(output, ["seo_product_name", "product_name", "title"] ) });
    else if (fieldPath === "handle") changes.push({ fieldPath, proposedValue: getValue(output, ["handle", "slug"] ) });
  }
  return changes.filter((change) => change.proposedValue !== undefined && change.proposedValue !== null && change.proposedValue !== "");
}

function currentValueFromProduct(raw: Record<string, unknown>, fieldPath: string) {
  if (fieldPath === "seo.title") return (raw.seo as Record<string, unknown> | undefined)?.title ?? null;
  if (fieldPath === "seo.description") return (raw.seo as Record<string, unknown> | undefined)?.description ?? null;
  if (fieldPath === "descriptionHtml" || fieldPath === "bodyHtml") return raw.descriptionHtml ?? raw.bodyHtml ?? null;
  if (fieldPath === "title") return raw.title ?? null;
  if (fieldPath === "handle") return raw.handle ?? null;
  if (fieldPath === "images.altText") return null;
  return null;
}

export async function createShopifyChangeSet(client: SupabaseClient, args: BuildArgs) {
  const includeFields = args.includeFields.filter((field) => !(args.excludeFields ?? []).includes(field));
  const validation = validateChangeSetFields(includeFields);
  if (!validation.ok) throw new Error(`forbidden_shopify_fields:${validation.blockers.map((blocker) => blocker.fieldPath).join(",")}`);

  const { data: store } = await client.from("shopify_stores").select("id,user_id,status").eq("id", args.storeId).eq("user_id", args.userId).maybeSingle();
  if (!store) throw new Error("shopify_store_not_found");

  let query = client.from("optimization_proposals").select("id,user_id,job_id,catalog_item_id,approved_version_id,active_version_id").eq("user_id", args.userId).not("approved_version_id", "is", null);
  if (args.jobId) query = query.eq("job_id", args.jobId);
  if (args.proposalIds?.length) query = query.in("id", args.proposalIds);
  const proposals = ((await query).data ?? []) as ProposalRow[];
  if (!proposals.length) throw new Error("no_approved_proposals_for_change_set");

  const { data: changeSet, error } = await client.from("change_sets").insert({ user_id: args.userId, integration: "shopify", store_id: args.storeId, job_id: args.jobId ?? null, status: "ready_for_dry_run", source: "approved_versions", title: args.title ?? "Cambios SEO aprobados para Shopify", write_scope_required: true }).select("id").single();
  if (error || !changeSet) throw new Error(error?.message ?? "change_set_create_failed");

  const items = [];
  for (const proposal of proposals) {
    const versionId = proposal.approved_version_id ?? proposal.active_version_id;
    if (!versionId || !proposal.catalog_item_id) continue;
    const [{ data: version }, { data: product }] = await Promise.all([
      client.from("optimization_proposal_versions").select("*").eq("id", versionId).eq("proposal_id", proposal.id).maybeSingle<VersionRow>(),
      client.from("shopify_products").select("shopify_product_gid,raw_product,catalog_item_id").eq("store_id", args.storeId).eq("catalog_item_id", proposal.catalog_item_id).maybeSingle(),
    ]);
    const output = (version?.content ?? version?.proposed_data ?? version?.output ?? {}) as Record<string, unknown>;
    const changes = buildProposedShopifyChanges(output, includeFields);
    for (const change of changes) {
      const raw = (product?.raw_product ?? {}) as Record<string, unknown>;
      items.push({ user_id: args.userId, change_set_id: changeSet.id, proposal_id: proposal.id, proposal_version_id: versionId, catalog_item_id: proposal.catalog_item_id, external_resource_type: "product", external_product_gid: product?.shopify_product_gid ?? null, field_group: change.fieldPath.split(".")[0], field_path: change.fieldPath, before_value: currentValueFromProduct(raw, change.fieldPath), proposed_value: change.proposedValue, fields: [change.fieldPath], before_snapshot: raw, proposed_changes: { [change.fieldPath]: change.proposedValue }, warnings: validation.warnings.map((warning) => warning.message), blockers: product ? [] : ["Producto Shopify no vinculado"], status: product ? "pending" : "blocked" });
    }
  }

  if (!items.length) throw new Error("no_supported_changes_for_shopify");
  const insert = await client.from("change_set_items").insert(items);
  if (insert.error) throw new Error(insert.error.message);
  const blocked = items.filter((item) => item.status === "blocked").length;
  await client.from("change_sets").update({ items_total: items.length, blocked_count: blocked, items_ready: items.length - blocked, status: blocked ? "blocked" : "ready_for_dry_run" }).eq("id", changeSet.id).eq("user_id", args.userId);
  return { changeSetId: changeSet.id, itemsTotal: items.length, blockedCount: blocked };
}
