import os
import json

# Load Spanish strings as the reference for missing phrases.
with open(os.path.join("l10n", "app_es.arb"), encoding="utf-8") as f:
    phrases = json.load(f)

for fname in os.listdir("l10n"):
    if not fname.startswith("app_") or not fname.endswith(".arb"):
        continue
    path = os.path.join("l10n", fname)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    changed = False
    for key, value in phrases.items():
        if key not in data:
            # Default to the Spanish value when missing
            data[key] = value
            changed = True

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
