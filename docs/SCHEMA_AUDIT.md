# Schema Audit

Rankelia detects and scores structured data for ecommerce pages. It is diagnostic only: it does not inject schema, guarantee rich results or invent data.

## Detects

Product, Organization, WebSite, BreadcrumbList, FAQPage, Article, BlogPosting, CollectionPage, ItemList, LocalBusiness, SearchAction, Offer, AggregateRating, Review, ProductGroup, OfferCatalog and AggregateOffer.

## Product rules

Rankelia checks name, image, brand, SKU, offers and risky review/rating fields. Ratings, reviews, price, availability and stock must be real and visible; Rankelia only suggests missing fields when data exists.

## Scoring

Scores consider parseable JSON-LD, Organization/WebSite, Product, Breadcrumb, FAQ, consistency and absence of risky fake ratings/reviews.

## Limitations

This is not Google's Rich Results Test and does not validate every schema.org edge case. Broken JSON-LD does not break the audit.
