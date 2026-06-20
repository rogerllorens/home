# Proposals workflow

Rankelia now separates generation from review. A `job_row` can create a `catalog_item`, an `optimization_proposal`, and one or more `optimization_proposal_versions`. The active version is what the reviewer is currently comparing. The approved version is the only version eligible for approved-only exports.

## Flow

1. Worker keeps writing `job_rows.output_data` for legacy compatibility.
2. Worker creates or reuses a `catalog_item` for the row.
3. Worker creates an `optimization_proposal` and initial version.
4. Reviewers compare original vs active version.
5. Reviewers can regenerate, manually edit, activate a version, mark needs review or approve.
6. Approved-only exports include only proposals with `approved_version_id`.

Rankelia does not publish changes automatically and does not guarantee rankings.

## GSC-assisted review
Proposal detail can show matched Search Console demand and a contextual action that pre-fills regeneration instructions with the top real query. This does not call Google from the frontend and does not promise ranking improvements.
