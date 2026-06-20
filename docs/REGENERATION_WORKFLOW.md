# Regeneration workflow

Regeneration is server-side only. The API validates auth, ownership, rate limits, scope and instruction length. Scope can be `full_product` or a safe field such as `meta_title`, `meta_description`, `short_description`, `long_description`, `primary_image_alt`, `gallery_image_alts`, `slug`, `schema` or `faq`.

The beta implementation creates a safe reviewed version and does not activate or approve it automatically. Future versions can plug in richer provider prompts while preserving the same versioning contract.
