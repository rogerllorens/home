# Proposal versioning

Every AI regeneration or manual edit creates a new immutable `optimization_proposal_versions` row. Activating a version updates `active_version_id`; approving updates `approved_version_id`. Approval never overwrites previous version data.

Version sources are `initial`, `regeneration`, `field_regeneration`, `manual_edit`, `imported` and `fallback`.
