# DEV 4 Dependencies Analysis

## Table of Contents
- [Overview](#overview)
- [Chatbot Tasks (Independent)](#chatbot-tasks-independent)
- [Staff Portal Tasks (Blocked)](#staff-portal-tasks-blocked)
- [Dependency Chain](#dependency-chain)
- [What DEV 4 Can Do Right Now](#what-dev4-can-do-right-now)
- [Recommendations](#recommendations)

---

## Overview

**DEV 4** has two major components:
1. **Chatbot (T4-1 to T4-3)** — ✅ **INDEPENDENT** — Can start immediately
2. **Staff Portal (T4-4 to T4-8)** — ❌ **BLOCKED** — Depends on DEV 2 workflow endpoints

---

## Chatbot Tasks (Independent) ✅

### T4-1: `chatbot-engine.ts` (State Machine + 5 Flows)

**Status:** 🟢 **NO DEPENDENCIES**

**Details:**
- Implement state machine with session management
- 5 conversation flows:
  1. Greeting → identify student need
  2. FAQ procedures (documents, timelines, contacts)
  3. Guide: Effet académique
  4. Guide: Correction de nom
  5. Guide: Contestation de note
- Redirect to form pages as needed

**Dependencies:** ✅ NONE

**Can start:** **TODAY**

---

### T4-1: `faq.json` (FAQ Data File)

**Status:** 🟢 **NO DEPENDENCIES**

**Details:**
- 10+ Q&A pairs about IUT procedures
- Document requirements
- Processing timelines
- Student contact methods
- Administrative procedures

**Dependencies:** ✅ NONE

**Can start:** **TODAY**

---

### T4-2: `POST /chatbot/message` Backend Route

**Status:** 🟢 **MINIMAL DEPENDENCIES**

**Details:**
- Backend endpoint for chat messages
- Session management (sessionId)
- State machine integration
- Optional user context (userId) to check personal request status
  - Only uses existing DEV 1 endpoints: `GET /auth/me`, `GET /requetes/me`

**Dependencies:** 
- ✅ `GET /auth/me` (DEV 1 — **ALREADY DONE**)
- ✅ `GET /requetes/me` (DEV 1 — **ALREADY DONE**)

**Can start:** **TODAY**

---

### T4-3: `ChatbotWidget.tsx` (Frontend Component)

**Status:** 🟢 **NO DEPENDENCIES**

**Details:**
- Floating chat bubble (bottom-right corner)
- 380×500px chat panel
- Message history (scrollable)
- Quick-reply buttons
- Session storage for message persistence
- Animation (slide-up on open/close)
- Available on all pages

**Dependencies:** ✅ NONE (pure frontend component)

**Can start:** **TODAY**

---

## Staff Portal Tasks (Blocked) ❌

### T4-4: `/staff/dashboard` (Statistics + Recharts)

**Status:** 🔴 **BLOCKED**

**Blocking Dependencies:**
- ❌ `GET /stats` endpoint (DEV 2 — T2-6)

**What's Needed:**
- Stats counts (by status, by type)
- 4-week evolution data
- Role-based filtering

**Can start:** Only when **DEV 2 (T2-6) is complete**

---

### T4-5: `/staff/requetes` (Role-Filtered Request List)

**Status:** 🔴 **BLOCKED**

**Blocking Dependencies:**
- ❌ `GET /requetes/staff?statut=&type=&page=&limit=` endpoint (DEV 2 — T2-6)
- Role-based filtering must be server-side

**What's Needed:**
- Pagination (10 per page)
- Status & type filtering
- Role-aware visibility
- Request list with student names, dates, statuses

**Can start:** Only when **DEV 2 (T2-6) is complete**

---

### T4-6: `/staff/requetes/[id]` (Request Processing Interface)

**Status:** 🔴 **BLOCKED**

**Blocking Dependencies:**
- ❌ `PUT /requetes/:id/receptionner` (DEV 2 — T2-1)
- ❌ `PUT /requetes/:id/acheminer` (DEV 2 — T2-1)
- ❌ `PUT /requetes/:id/valider` (DEV 2 — T2-2)
- ❌ `PUT /requetes/:id/rejeter` (DEV 2 — T2-2)
- ❌ `PUT /requetes/:id/demander-info` (DEV 2 — T2-2)
- ❌ `PUT /requetes/:id/executer` (DEV 2 — T2-3)
- ❌ `PUT /requetes/:id/cloturer` (DEV 2 — T2-3)

**What's Needed:**
- Request detail display
- Timeline history
- Conditional action buttons (based on role + status)
- Modal confirmations for irreversible actions
- Real-time status updates

**Can start:** Only when **DEV 2 (T2-1, T2-2, T2-3) are complete**

---

### T4-7: E2E Tests (3 Complete Workflows)

**Status:** 🔴 **BLOCKED**

**Blocking Dependencies:**
- ❌ DEV 2 workflow endpoints (ALL tasks T2-1 to T2-7)
- ❌ DEV 3 student request forms

**What's Needed:**
- Test all 3 request types end-to-end
- Verify notifications at each step
- Test from student submission → staff processing → closure

**Can start:** Only when **DEV 2 + DEV 3 are complete**

---

### T4-8: Final Delivery & Demo Prep

**Status:** 🔴 **BLOCKED**

**Blocking Dependencies:**
- All of T4-1 through T4-7
- Final bug fixes and coordination

**Can start:** Only when **all tasks above are complete**

---

## Dependency Chain

```
┌─────────────────────────────────────┐
│  DEV 1 (Backend Auth + Student API)  │
│           ✅ COMPLETE               │
└────────────┬────────────────────────┘
             │
             ├─────────────────────────────────────────┐
             │                                         │
    ┌────────▼──────────────┐          ┌──────────────▼─────────────────┐
    │  DEV 4 CHATBOT        │          │  DEV 2 WORKFLOW ENDPOINTS      │
    │  (T4-1 to T4-3)       │          │  (T2-1 to T2-7)               │
    │  ✅ CAN START NOW     │          │  ❌ NOT STARTED               │
    │                       │          │                               │
    │ • chatbot-engine.ts   │          │ • receptionner/acheminer      │
    │ • faq.json            │          │ • valider/rejeter/demander    │
    │ • /chatbot/message    │          │ • executer/cloturer           │
    │ • ChatbotWidget.tsx   │          │ • notifications               │
    └───────────────────────┘          │ • stats endpoint              │
                                       └──────────────┬────────────────┘
                                                      │
                                       ┌──────────────▼────────────────┐
                                       │  DEV 4 STAFF PORTAL           │
                                       │  (T4-4 to T4-8)              │
                                       │  ❌ BLOCKED                   │
                                       │                               │
                                       │ • /staff/dashboard            │
                                       │ • /staff/requetes             │
                                       │ • /staff/requetes/[id]        │
                                       │ • E2E tests                   │
                                       │ • Final delivery              │
                                       └───────────────────────────────┘
```

---

## What DEV 4 Can Do Right Now

### Immediate (Can Start Today) 🚀

| Task | Component | Status | Priority |
|------|-----------|--------|----------|
| **T4-1** | `chatbot-engine.ts` | 🟢 Ready | **HIGH** |
| **T4-1** | `faq.json` | 🟢 Ready | **HIGH** |
| **T4-2** | `POST /chatbot/message` | 🟢 Ready | **HIGH** |
| **T4-3** | `ChatbotWidget.tsx` | 🟢 Ready | **HIGH** |

**Estimated Time:** 3-4 days

**Output:** Fully functional chatbot with all 5 flows + widget on all pages

---

### While Waiting for DEV 2 ⏳

| Task | Approach | Status |
|------|----------|--------|
| **T4-4: Dashboard** | Build UI with mock data | 🟡 Can prototype |
| **T4-5: Staff List** | Build UI with mock data | 🟡 Can prototype |
| **T4-6: Processing Interface** | Build UI with mock data | 🟡 Can prototype |

**Note:** When DEV 2 finishes, swap mock data → real API calls (15 min swap)

---

### Blocked (Wait for DEV 2) 🔴

| Task | Reason | Status |
|------|--------|--------|
| **T4-4: Dashboard stats** | Needs `GET /stats` | ❌ Blocked |
| **T4-5: Staff list filtering** | Needs `GET /requetes/staff` | ❌ Blocked |
| **T4-6: Action buttons** | Needs 7 workflow endpoints | ❌ Blocked |
| **T4-7: E2E tests** | Needs complete workflows | ❌ Blocked |

---

## Recommendations

### Strategy: Hybrid Parallelization (Most Efficient) ⚡

**Timeline:**
```
Day 1-2: DEV 4 starts chatbot (T4-1 to T4-3)
         DEV 2 starts workflow endpoints (T2-1 to T2-3)

Day 3-4: DEV 4 finishes chatbot
         DEV 2 finishes notifications + stats (T2-4 to T2-6)

Day 5-6: DEV 4 builds staff portal with mock data
         DEV 2 starts validation + tests (T2-5, T2-8)

Day 7-8: DEV 4 integrates real API endpoints
         DEV 4 builds E2E tests

Day 9+:  Final fixes, demo prep
```

### Benefits:
✅ No idle time for DEV 4  
✅ Chatbot shipped in parallel  
✅ Staff portal ready for API integration  
✅ Maximum parallelization  

---

## Summary Table

| DEV 4 Task | Independent? | Dependencies | Start? | Est. Time |
|-----------|--------------|--------------|--------|-----------|
| T4-1: chatbot-engine.ts | ✅ Yes | None | **TODAY** | 1 day |
| T4-1: faq.json | ✅ Yes | None | **TODAY** | 0.5 day |
| T4-2: /chatbot/message | ✅ Yes | DEV 1 (done) | **TODAY** | 1 day |
| T4-3: ChatbotWidget.tsx | ✅ Yes | None | **TODAY** | 1 day |
| T4-4: /staff/dashboard | ❌ No | DEV 2 (T2-6) | Day 7+ | 1 day |
| T4-5: /staff/requetes | ❌ No | DEV 2 (T2-6) | Day 7+ | 1 day |
| T4-6: /staff/requetes/[id] | ❌ No | DEV 2 (T2-1-3) | Day 7+ | 2 days |
| T4-7: E2E tests | ❌ No | DEV 2 + DEV 3 | Day 11+ | 1 day |
| T4-8: Final delivery | ❌ No | All above | Day 13+ | 1 day |

---

## Next Steps

**Immediate Actions:**

1. ✅ Create `backend/src/chatbot/chatbot-engine.ts` (state machine)
2. ✅ Create `backend/src/chatbot/faq.json` (FAQ data)
3. ✅ Create `backend/src/routes/chatbotRoutes.ts` + controller
4. ✅ Create `src/components/ChatbotWidget.tsx` (UI)
5. ⏳ Coordinate with DEV 2 on workflow timeline

**For DEV 2 (Parallel):**
- Start T2-1: Secretariat workflow endpoints
- Follow with T2-2 & T2-3: Direction & execution endpoints
- Implement T2-4: Notification system
- Complete T2-6: Stats endpoint

**Result:** DEV 4 ships chatbot in ~4 days, staff portal ready for integration in ~8 days.

---

## Questions?

- **Can we start chatbot now?** YES ✅
- **Do we need DEV 2 for chatbot?** NO ✅
- **Can we mock staff portal while waiting?** YES ✅ (swap in real API later)
- **When can we test everything E2E?** After DEV 2 completes (Day 9+)

---

**Last Updated:** 2026-06-22  
**Status:** Ready to proceed with chatbot implementation
