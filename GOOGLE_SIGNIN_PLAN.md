# Google Sign-In Implementation Plan

## Current Status Analysis
- NextAuth is already configured with Google Provider in `app/lib/auth.ts`
- Google credentials are placeholder values in `.env`
- Login component exists but uses generic sign-in
- Database adapter (Prisma) is configured
- Custom sign-in page is missing

## Implementation Steps

### 1. Google Cloud Console Setup
- [ ] Create a new project in Google Cloud Console (or use existing)
- [ ] Enable Google+ API or Google Sign-In API
- [ ] Configure OAuth consent screen with app details
- [ ] Create OAuth 2.0 credentials (Client ID & Secret)
- [ ] Set authorized redirect URIs:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://yourdomain.com/api/auth/callback/google`

### 2. Environment Configuration
- [ ] Replace `GOOGLE_CLIENT_ID` with real Client ID
- [ ] Replace `GOOGLE_CLIENT_SECRET` with real Client Secret
- [ ] Ensure `NEXTAUTH_SECRET` is properly set (not placeholder)
- [ ] Update `NEXTAUTH_URL` for production deployment

### 3. Custom Sign-In Page Creation
- [ ] Create `/app/auth/signin/page.tsx` (currently missing)
- [ ] Add Google-specific sign-in button with proper styling
- [ ] Integrate with existing UI components (Card, Button, etc.)
- [ ] Add Google branding and icons
- [ ] Handle loading and error states

### 4. Login Component Enhancement
- [ ] Update `app/components/login-page.tsx`
- [ ] Replace generic `signIn()` with `signIn('google')`
- [ ] Add Google-specific styling and branding
- [ ] Consider adding fallback to credentials login if needed

### 5. Testing & Verification
- [ ] Test Google sign-in flow end-to-end
- [ ] Verify user data is properly stored in database
- [ ] Check session management and user persistence
- [ ] Test sign-out functionality
- [ ] Verify redirect behavior after authentication

## Files to Modify/Create

### Existing Files to Update:
- `app/components/login-page.tsx` - Update sign-in method
- `.env` - Add real Google OAuth credentials

### New Files to Create:
- `app/auth/signin/page.tsx` - Custom sign-in page

### Files Already Configured:
- `app/lib/auth.ts` - Google Provider already added
- `app/api/auth/[...nextauth]/route.ts` - Route handler ready
- `app/types/next-auth.d.ts` - Type definitions ready

## Technical Notes

### Current Auth Configuration:
- Using JWT strategy
- Prisma adapter configured
- Session callback includes user ID
- Custom sign-in page route: `/auth/signin`

### Google Provider Configuration:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
}),
```

### Required Environment Variables:
```
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_secret
```

## Benefits of Current Setup
- NextAuth provides robust OAuth handling
- Automatic user creation and session management
- Database persistence through Prisma adapter
- Type-safe session handling
- Built-in CSRF protection

## Potential Considerations
- Handle users who sign in with Google vs credentials
- Consider email verification requirements
- Plan for profile picture handling from Google
- Account linking if user exists with same email

---
*Created: 2025-09-18*
*Status: Ready for implementation*