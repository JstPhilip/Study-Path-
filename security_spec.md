# Security Specification - Firebase Security Rules

## 1. Data Invariants
1. A **User** profile must only be created or modified by the authenticated user matching their specific `userId` path variable. Users cannot overwrite other users' achievements or elevate their user credentials.
2. A **Deadline** card must belong to the creator holding a valid `userId` matching `request.auth.uid`. No user can read, edit or delete another student's deadline items.
3. A **StudyLog** must belong to the logged-in student who completed the work. These are immutable once added to guarantee progress ledger audit integrity.
4. **ScratchNotes** contain markdown workspaces with mathematical equations; users can only read or write their own note document.
5. **Resources** are scholar references; they are kept isolated per academic owner and must be correctly structured within the permitted categories list.

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Vector Matrix)

| # | Vulnerability Channel | Target Path | Payload / Attack Intent | Secure Block Result |
|---|---|---|---|---|
| 1 | Identity Spoofing | `/users/user_alice` | Attempt to write profile details targeting user_alice with auth of Bob | `PERMISSION_DENIED` |
| 2 | Privilege Escalation | `/users/user_bob` | Write `"isAdmin": true` or `"role": "admin"` to Bob's profile | `PERMISSION_DENIED` |
| 3 | Path ID Poisoning | `/deadlines/invalid_#$#_id` | Inject bad ID strings into path parameters to exhaust server storage | `PERMISSION_DENIED` |
| 4 | Value Poisoning | `/deadlines/dl_1` | Inject 10MB string into title or negative character arrays | `PERMISSION_DENIED` |
| 5 | Ghost Field Injection | `/users/user_bob` | Create field `"isGoldPro": true` to bypass payment locks | `PERMISSION_DENIED` |
| 6 | Orphaned Record | `/deadlines/dl_1` | Add a deadline where `userId` is empty or mismatching `auth.uid` | `PERMISSION_DENIED` |
| 7 | Cross-Tenant Leak | `/deadlines/dl_alice` | Alice attempts to read Bob's assignment deadlines through direct SDK query | `PERMISSION_DENIED` |
| 8 | Temporal Spoofing | `/studyLogs/log_1` | Inject client-generated timezone timestamps e.g. `"createdAt": "2050-01-01"` | `PERMISSION_DENIED` |
| 9 | Terminal State Bypass | `/deadlines/dl_1` | Modify the immutable creation date or change properties index state | `PERMISSION_DENIED` |
| 10 | Unbounded List Overwrite | `/users/user_bob` | Inject thousands of items into `completedMilestones` to cause browser buffer crashes | `PERMISSION_DENIED` |
| 11 | Spoofed Email verification | `/deadlines/dl_1` | Set email verified to false but bypass email-only check on rules | `PERMISSION_DENIED` |
| 12 | System Field Tampering | `/scratchNotes/n_1` | Empty another user's research drafts with random ASCII payloads | `PERMISSION_DENIED` |

---

## 3. The Security Rule Fortress Strategy

The generated `firestore.rules` uses:
* Global default deny (`match /{document=**} { allow read, write: if false; }`).
* Named validation helper functions like `isValidUser(data)`, `isValidDeadline(data)`, `isValidStudyLog(data)`, `isValidResource(data)`, and `isValidScratchNote(data)`.
* ID verification: `isValidId(userId)` to ensure standard path naming and length structure.
* Atomic verification: Strict matching on size bounds, type matching, and temporal integrity with `request.time`.
