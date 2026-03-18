# STARWAVE CREATIONS

## Current State
A marketplace PWA for books and short films with:
- Home page with featured books and films sections
- Books, Films browsing pages
- Book and Film detail pages
- Creator Dashboard for uploading content
- Admin Dashboard with tabs: Content Review, All Content, Purchases, Users, Stripe, Team
- Profile page with Principal ID copy
- Library page for purchased content
- Yellow "Claim Admin" banner for first user
- Blue/purple color scheme (OKLCH hue 285)
- Stripe payment integration with UPI support
- Admin can delete books and films, approve/reject, view user profiles, assign roles

## Requested Changes (Diff)

### Add
- Home page: Add "STARWAVE CREATIONS BOOKSTORE" branding as main title/hero
- Home page: Add category/genre filter sections for both books and films
- Creator profile pages visible to customers ("Creators" tab or page listing writers/directors)
- Creator detail page showing writer/director info, contact (phone/email), their uploaded content, and offline availability (author-provided location for physical books)
- Offline book availability: authors can provide a physical location where their book can be obtained
- Creator profile includes phone number and email field (stored in profile)
- Publisher/upload form extended to include phone, email, offline location for books
- Updated dark color theme: deep space dark with blue, purple, black, white tones

### Modify
- ProfileSetupPage: Add phone number and email fields
- UserProfile backend type: add phone and email fields
- Home page hero: Replace generic "Where Stories Come to Life" with STARWAVE CREATIONS branding
- BooksPage and FilmsPage: Add genre/category filter chips at top
- CreatorDashboard: Add offline location field for books
- Book type: Add offlineLocation field (optional text)

### Remove
- Nothing removed

## Implementation Plan
1. Update UserProfile backend type to include phone and email
2. Update saveCallerUserProfile, getCallerUserProfile, getAllUserProfiles to handle new fields
3. Add offlineLocation field to Book type in backend
4. Add getCreatorProfiles public query for customers to view writers/directors
5. Update HomePage with STARWAVE CREATIONS branding + category sections
6. Update ProfileSetupPage with phone and email fields
7. Add CreatorsPage listing all creators with their info
8. Update BooksPage and FilmsPage with genre filter chips
9. Update CreatorDashboard book upload form with offline location field
10. Update color theme to deep space blue/purple/black/white
11. Add CreatorsPage and creator detail view to App routing
