# AI GENERATION RUNS

Prompt 6 introduces AI Template Studio foundations: database-backed prompt templates, append-only prompt versions, sector rules, model configs, routing rules, generation runs, experiments and cost monitoring.

Key rules:
- AI never runs from the frontend.
- Admin writes must happen server-side and require admin role.
- Prompt activation requires output schema and safety language.
- Providers are only considered real when an adapter and env are configured; Anthropic/Gemini remain prepared/paused until tested.
- Every generation should record provider, model, prompt version, fallback, token/cost estimate and quality warnings.
- Rankelia does not promise rankings, traffic or automatic publishing.
