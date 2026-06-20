# XLS Import

Legacy binary `.xls` remains a safe rejection in this release. Rankelia detects `.xls` and asks users to upload `.xlsx`, CSV or paste the table.

Do not claim XLS support until a real parser is added with binary fixtures covering acents, formulas, corrupt files and macro-safe behavior.

Prompt 6 decision: keep safe rejection. We did not add a binary `.xls` parser because this PR focuses on AI Template Studio and activation; claiming `.xls` support still requires a server-side parser plus real binary fixtures.
