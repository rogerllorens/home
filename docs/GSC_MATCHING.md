# GSC catalog matching

URLs are normalized by lower-casing hosts, removing hashes/tracking parameters (`utm_*`, `gclid`, `fbclid`, `msclkid`), normalizing trailing slash and matching safe product paths. Matching methods are exact product URL, normalized product URL, handle in path, slug in path and SKU in path. Confidence ranges from 1.0 exact to 0.5 SKU. Fuzzy matching is intentionally conservative to avoid assigning Google metrics to the wrong product.
