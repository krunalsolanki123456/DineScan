# DineScan Customer Ordering Redesign

Updated the public QR ordering experience to a mobile-first app-style flow inspired by the approved design direction.

## Updated screens
- Customer Menu Home
- Dedicated Food Item Detail
- Cart / Checkout
- Order Tracking / Success

## UX changes
- Full-height mobile application shell
- Restaurant hero with rating, hours and table context
- Sticky search/category/filter controls
- Two-column food cards with quick add
- Dedicated item customization screen with spice level, add-ons and instructions
- App-style cart with quantity controls, split GST summary and sticky checkout button
- Order status timeline and dining thank-you state
- Existing restaurant, menu, cart and order services are reused

## New route
`/menu/:restaurantSlug/item/:itemId`

The existing QR table query parameter is preserved through menu, item detail and cart navigation.
