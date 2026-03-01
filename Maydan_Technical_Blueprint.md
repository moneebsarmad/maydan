# Maydan — Technical Blueprint
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** February 27, 2026  
**Stack:** Next.js + Supabase + Vercel  

---

## 1. Tech Stack Summary

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) | Fullstack, file-based routing, server components |
| UI | shadcn/ui + Tailwind CSS | Clean, accessible, fast to build with |
| Backend | Next.js API Routes + Server Actions | No separate backend needed |
| Database | Supabase (PostgreSQL) | Managed, real-time, built-in auth |
| Auth | Supabase Auth (email/password) | Simple, secure, integrates with RLS |
| Real-time | Supabase Realtime | Live approval status updates |
| File Storage | Supabase Storage | Marketing request file uploads |
| Email | Resend | Clean transactional emails, generous free tier |
| Hosting | Vercel | Native Next.js support, free tier sufficient for V1 |
| Version Control | GitHub | Solo dev, CI/CD via Vercel GitHub integration |

---

## 2. Architecture Overview
```
┌─────────────────────────────────────┐
│           Vercel (Hosting)          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Next.js 14 App          │    │
│  │                             │    │
│  │  ┌──────────┐ ┌──────────┐  │    │
│  │  │  Pages   │ │   API    │  │    │
│  │  │  (RSC)   │ │ Routes / │  │    │
│  │  │          │ │ Server   │  │    │
│  │  │          │ │ Actions  │  │    │
│  │  └──────────┘ └──────────┘  │    │
│  └─────────────────────────────┘    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           Supabase                  │
│                                     │
│  ┌──────────┐  ┌──────────────┐     │
│  │   Auth   │  │  PostgreSQL  │     │
│  │          │  │  + RLS       │     │
│  └──────────┘  └──────────────┘     │
│                                     │
│  ┌──────────┐  ┌──────────────┐     │
│  │ Realtime │  │   Storage    │     │
│  │ (events) │  │  (files)     │     │
│  └──────────┘  └──────────────┘     │
└─────────────────────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           Resend                    │
│     (Transactional Emails)          │
└─────────────────────────────────────┘
```

---

## 3. Project Structure
```
maydan/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── events/
│   │   │   ├── new/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── approvals/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   └── admin/
│   │       ├── users/
│   │       ├── entities/
│   │       └── facilities/
│   ├── api/
│   │   ├── events/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   └── emails/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── events/
│   ├── approvals/
│   ├── notifications/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── resend/
│   │   └── emails.ts
│   ├── routing/
│   │   └── approval-router.ts   # Core routing logic
│   └── utils/
├── types/
│   └── index.ts
├── middleware.ts
└── supabase/
    ├── migrations/
    └── seed.sql
```

---

## 4. Database Schema

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('submitter', 'approver', 'viewer', 'admin')),
  title TEXT,
  entity_id UUID REFERENCES entities(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### entities
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('club', 'house', 'department', 'athletics')),
  grade_level TEXT CHECK (grade_level IN ('MS', 'HS', 'Both')),
  head_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### facilities
```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INT,
  notes TEXT,
  active BOOLEAN DEFAULT true
);
```

### events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  facility_id UUID REFERENCES facilities(id),
  facility_notes TEXT,
  description TEXT,
  audience TEXT[],
  grade_level TEXT CHECK (grade_level IN ('MS', 'HS', 'Both')),
  expected_attendance INT,
  staffing_needs TEXT,
  marketing_needed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'needs_revision', 'approved', 'cancelled'
  )),
  submitter_id UUID REFERENCES users(id),
  entity_id UUID REFERENCES entities(id),
  current_step INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### approval_steps
```sql
CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  step_number INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected'
  )),
  reason TEXT,
  suggested_date DATE,
  suggested_start_time TIME,
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### marketing_requests
```sql
CREATE TABLE marketing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT,
  target_audience TEXT,
  priority TEXT DEFAULT 'standard' CHECK (priority IN ('standard', 'urgent')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Row Level Security (RLS) Policies

### Key Rules
- Users can only read/write their own submissions
- Approvers can only see events in their approval queue
- Admin has full access to all tables
- Facilities Director can read all events (CC role)
- Notifications are private — users see only their own

### Example Policies
```sql
-- Users can read their own events
CREATE POLICY "submitters_own_events" ON events
  FOR SELECT USING (submitter_id = auth.uid());

-- Approvers can see events assigned to them
CREATE POLICY "approvers_see_queue" ON approval_steps
  FOR SELECT USING (approver_id = auth.uid());

-- Admin sees everything
CREATE POLICY "admin_full_access" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 6. Approval Routing Engine

The core of Maydan. Lives in `lib/routing/approval-router.ts`.

### Logic
When an event is submitted, the router:
1. Reads the entity type and grade level from the event
2. Builds an ordered array of approver user IDs based on the routing matrix
3. Creates `approval_steps` rows for each step
4. Sets event status to `pending` and `current_step` to 1
5. Notifies Step 1 approver

### Routing Matrix (Code Logic)
```typescript
type EntityType = 'club' | 'house' | 'department' | 'athletics'
type GradeLevel = 'MS' | 'HS' | 'Both'

async function buildApprovalChain(
  entityType: EntityType,
  entityId: string,
  gradeLevel: GradeLevel
): Promise<string[]> {  // returns ordered array of user IDs

  const chain: string[] = []

  switch (entityType) {
    case 'club':
      chain.push(await getClubAdviser(entityId))
      chain.push(await getHSPrincipal())
      break

    case 'house':
      chain.push(await getHouseMentor(entityId))
      chain.push(await getTarbiyahDirector())
      chain.push(await getHSPrincipal())
      break

    case 'athletics':
      chain.push(await getSubmittingCoach(entityId))
      chain.push(await getAthleticDirector())
      chain.push(await getHSPrincipal())
      break

    case 'department':
      chain.push(await getDepartmentHead(entityId))
      if (gradeLevel === 'MS') {
        chain.push(await getMSPrincipal())
      } else {
        chain.push(await getHSPrincipal())
      }
      break
  }

  // Facilities Director always CC'd — handled separately
  return chain
}
```

### Approval Progression
When an approver approves:
1. Current `approval_steps` row updated to `approved`
2. `events.current_step` incremented
3. Next approver in chain notified
4. If final step — event status set to `approved`, submitter notified

When an approver rejects:
1. Current step marked `rejected` with reason
2. Event status set to `needs_revision`
3. Submitter notified with reason or suggested alternative
4. On resubmission — all steps reset, chain restarts from Step 1

---

## 7. Real-time Updates

Using Supabase Realtime to subscribe to event and approval status changes.
```typescript
// Subscribe to event status changes for submitter
const channel = supabase
  .channel('event-status')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: `submitter_id=eq.${userId}`
    },
    (payload) => {
      // Update UI with new status
    }
  )
  .subscribe()

// Subscribe to approval queue for approvers
const approvalChannel = supabase
  .channel('approval-queue')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'approval_steps',
      filter: `approver_id=eq.${userId}`
    },
    (payload) => {
      // Show new item in queue
    }
  )
  .subscribe()
```

---

## 8. Email Notifications (Resend)

### Triggers & Recipients

| Trigger | Recipient |
|---------|-----------|
| Event submitted | Step 1 approver + Facilities Director |
| Step approved, next step exists | Next approver in chain |
| Event fully approved | Submitter |
| Event rejected | Submitter (with reason) |
| Marketing needed | PR staff |
| Facility conflict flagged | Submitter + current approver |

### Setup
```typescript
// lib/resend/emails.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApprovalRequestEmail(
  to: string,
  eventName: string,
  eventId: string
) {
  await resend.emails.send({
    from: 'maydan@bhaprep.org',
    to,
    subject: `Action Required: Approve "${eventName}"`,
    html: `...`
  })
}
```

---

## 9. File Storage (Supabase Storage)

Marketing request attachments stored in Supabase Storage.
```
Bucket: marketing-uploads
Path:   {event_id}/{filename}
Access: Private — only accessible to PR staff and Admin
```

---

## 10. Authentication Flow

1. Admin creates user account manually (no self-signup)
2. User receives email invite via Supabase Auth
3. User sets password on first login
4. Session managed via Supabase Auth + Next.js middleware
5. Role and entity loaded from `users` table on session start
6. RLS policies enforce access at database level

---

## 11. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 12. Key Dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "resend": "^3.x",
    "tailwindcss": "^3.x",
    "shadcn-ui": "latest",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "latest"
  }
}
```

---

## 13. Performance & Scalability Notes
- Supabase free tier handles up to 500MB DB and 1GB storage — more than sufficient for V1
- Vercel free tier handles hobby/small org traffic comfortably
- Resend free tier: 3,000 emails/month — sufficient for a school
- Real-time subscriptions are lightweight at this scale
- RLS at DB level means no performance-heavy middleware checks

---

## 14. Security Considerations
- No self-signup — Admin controls all accounts
- RLS enforced at database level, not just UI
- Service role key never exposed to client
- File uploads scoped per event, private bucket
- All API routes protected via Supabase session check
- Email invites expire — users must set password promptly

---

*Maydan Technical Blueprint v1.0 — BHA Prep*