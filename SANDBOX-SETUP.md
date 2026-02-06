# Sandbox + Portal Unified Auth Setup

**Goal**: Portal and sandbox-app share one Clerk application. Students sign up once, get onboarded, then can use both portal and sandbox.

---

## 1. Clerk Application (One for Both)

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. In **Configure → Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/onboarding` (portal)
   - After sign-up: `/onboarding`
3. In **Configure → Domains** (or allowed redirect origins):
   - `http://localhost:3000` (portal)
   - `http://localhost:3001` (sandbox)
   - Add your production domains when deploying

---

## 2. Portal `.env.local`

**Required for build**: Add Clerk keys before `npm run build`. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
NEXT_PUBLIC_SANDBOX_URL=http://localhost:3001
```

---

## 3. Sandbox `.env` (Same Clerk Keys)

In `sandbox-app/frontend/.env`, use the **same** Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # same as portal
CLERK_SECRET_KEY=sk_test_...                     # same as portal
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Sandbox redirects to its own `/dashboard` after auth. Because both apps use the same Clerk keys, when a user signs in on the portal, they are also signed in when they open the sandbox (same session/cookies for same domain; for different ports in dev, Clerk handles cross-origin).

---

## 4. Student Onboarding Flow

1. Student visits portal → clicks **Sign up**
2. Completes Clerk sign-up
3. Redirected to `/onboarding`
4. Selects **Student** and **School/Program**
5. Clicks **Continue** → `publicMetadata: { onboarded: true, role, school }` saved
6. Redirected to `/lessons`

Returning users who are onboarded: sign-in → onboarding page detects `metadata.onboarded` → redirect to `/lessons`.

---

## 5. Running Both Apps

**Terminal 1 – Portal:**
```bash
cd portal
npm run dev
# http://localhost:3000
```

**Terminal 2 – Sandbox:**
```bash
cd sandbox-app/frontend
npm install
npm run dev
# http://localhost:3001
```

**Terminal 3 – Sandbox backend** (optional, for full sandbox features):
```bash
cd sandbox-app/backend/server
npm install
npm run dev
# port 4000
```

Sandbox also needs Cloudflare Workers (database, storage, AI) and Liveblocks, E2B – see sandbox README.

---

## 6. Navigation

- Portal nav includes **Sandbox** link → opens sandbox in new tab (`NEXT_PUBLIC_SANDBOX_URL`)
- Students sign in on portal; when they open sandbox, Clerk session is shared (same keys, same browser)
