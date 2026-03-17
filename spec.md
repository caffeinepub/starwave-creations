# STARWAVE CREATIONS

## Current State
Full-stack PWA for short films and books. Backend has `claimFirstAdmin()` and `hasAdminBeenAssigned()` functions, but the canister state has `adminAssigned = true` from a prior failed attempt, preventing any user from claiming admin. The frontend banner logic depended on `hasAdminBeenAssigned()` which is not in `backend.d.ts`, causing silent failures.

## Requested Changes (Diff)

### Add
- Backend: robust `claimFirstAdmin()` that checks actual admin role assignments rather than relying on a flag, so it works even if the flag got out of sync

### Modify
- Backend: `claimFirstAdmin` logic -- check real role map for existing admins instead of just the `adminAssigned` boolean flag
- Frontend App.tsx: show yellow claim-admin banner whenever signed-in user's role is `guest`, without depending on `hasAdminBeenAssigned()`

### Remove
- Frontend: dependency on `(actor as any).hasAdminBeenAssigned()` call

## Implementation Plan
1. Regenerate Motoko backend with fixed `claimFirstAdmin` that iterates roles to check for existing admins
2. Update App.tsx banner: show when `identity` exists and `userRole === guest`
3. Validate and deploy
