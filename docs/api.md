# API Reference

## SafeBrowsing.verifyUrl(url)
Checks a URL against the Google Safe Browsing API.

**Input**
- `url` (string): URL to validate.

**Output**
- `{ safe: boolean, threatType?: string }`

## ProductLookup.lookupUPC(upc)
Queries UPCitemdb for product information with a fallback to barcode.monster if
rate limits are exceeded.

**Input**
- `upc` (string): barcode value.

**Output**
- `{ name: string, image: string, price?: string }`
