# Free SEO Audit security

The audit only accepts public `http`/`https` URLs without credentials or unusual ports. It blocks localhost, private IPv4/IPv6, link-local, cloud metadata endpoints and internal suffixes. DNS rebinding is mitigated by resolving a public IP during validation and pinning the actual fetch connection to that IP. Redirects are revalidated hop by hop.
