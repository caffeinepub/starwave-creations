# STARWAVE CREATIONS

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Creator accounts: writers and directors can register and manage their profile
- Content upload: creators can upload short films (video files) and publish books (with cover image, description, price)
- Customer browsing: public catalog of books and short films, filterable by type
- Purchase flow: customers can buy books; Stripe payments; 60% revenue to creator, 40% to admin
- Admin dashboard: manage users, content moderation, view revenue splits
- PWA support: web app manifest + service worker for installability on devices
- Role-based access: guest (browse only), customer (browse + purchase), creator (upload + manage content), admin (full access)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: user roles (admin, creator, customer), content types (Book, ShortFilm), purchase records with 60/40 revenue split tracking, blob storage for videos and book covers
2. Frontend: landing/browse page, content detail pages, creator dashboard (upload, manage), customer purchase flow, admin dashboard
3. PWA: manifest.json, service worker registration
4. Auth: role-based access via authorization component
5. Payments: Stripe integration for book purchases
