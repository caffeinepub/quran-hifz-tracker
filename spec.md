# Quran Hifz Tracker

## Current State
Admin login uses Internet Identity (II) directly. Teachers use email+password which triggers II in the background. Backend recognizes admin via hardcoded email check.

## Requested Changes (Diff)

### Add
- Admin credential seeded in backend: `murtazatinwala@msbinstitute.com` / `msb123`
- `claimTeacherAccount` grants `#admin` role when claimed email == ADMIN_EMAIL

### Modify
- `AuthPage.tsx`: Replace the Admin tab's Internet Identity button with the same email+password form as Teacher tab (unified login UI)
- `App.tsx`: Remove the `hasPendingClaim` guard that bypassed profile setup only for admin; admin now goes through normal claim flow
- Backend `postupgrade`: Seed admin credential alongside teacher credential

### Remove
- Internet Identity-specific admin login UI (Shield icon, "Sign In with Internet Identity" button)
- Two-tab auth layout (or collapse to single form since both roles use same login)

## Implementation Plan
1. Modify `main.mo`: seed admin credential in `postupgrade`, update `claimTeacherAccount` to set `#admin` for admin email
2. Modify `AuthPage.tsx`: remove Admin tab with II button; use single email+password form for all users
3. Modify `App.tsx`: simplify claim handling since both admin and teacher use same flow
