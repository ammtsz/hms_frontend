# 🧪 Comprehensive Testing Checklist - HMS

This checklist covers all features and edge cases for the Healthcare Management System. Use it for manual testing, regression testing, and feature validation.

**Status Legend:**

- ✅ Pass
- ❌ Fail
- ⏭️ Skip
- 🔄 In Progress

---

## 🔐 1. Authentication & Authorization

### Login Flow

- [ ] Login page renders correctly
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Login with empty fields shows validation errors
- [ ] Redirect to `/board` after successful login
- [ ] Session persists across page refresh
- [ ] Protected routes redirect to `/login` when unauthenticated

### User Menu

- [ ] User menu displays username in top navigation
- [ ] User menu dropdown opens/closes on click
- [ ] User info displays correctly in dropdown
- [ ] Logout button visible in dropdown
- [ ] Logout clears session and redirects to login
- [ ] Click outside closes user menu

---

## 🧭 2. Navigation & Layout

### Top Navigation

- [ ] Top navigation displays "HSM" branding
- [ ] Clinic timezone label visible on desktop
- [ ] Clinic timezone label hidden on mobile breakpoint
- [ ] User menu button visible when authenticated
- [ ] Navigation sticky on scroll
- [ ] Responsive on mobile devices

### Tab Navigation

- [ ] All tabs visible: Board, Schedule, Patients, Treatments
- [ ] Active tab highlighted correctly
- [ ] Tab navigation works (page switches)
- [ ] `aria-current="page"` set on active tab
- [ ] Keyboard navigation works (Tab key)
- [ ] Hidden when not authenticated

### Home Page

- [ ] Home page (`/`) redirects to `/board`

---

## ⏰ 3. Timezone Management

### Clinic Timezone Display

- [ ] Clinic timezone is read from `NEXT_PUBLIC_CLINIC_TIMEZONE`
- [ ] Backend and frontend timezone env values match
- [ ] Top navigation shows the read-only clinic timezone label
- [ ] No timezone selector is exposed in the UI
- [ ] Date formatting uses the clinic timezone consistently
- [ ] Invalid timezone env values fall back to `America/Sao_Paulo`

---

## 👥 4. Patient Management

### Patient List (`/patients`)

- [ ] Patient list renders with all patients
- [ ] Search functionality works
- [ ] Filter by status works (Active, Discharged, etc.)
- [ ] Patient cards display all info correctly
- [ ] Click patient card navigates to detail page
- [ ] "New Patient" button visible
- [ ] Loading states show during data fetch
- [ ] Error states show on API failure
- [ ] Empty state shows when no patients

### New Patient Form (`/patients/new`)

- [ ] Form renders all fields correctly
- [ ] Required field validation works
- [ ] Phone number auto-formats: (XXX) XXX-XXXX
- [ ] Birth date starts empty (not prefilled with today)
- [ ] Birth date can be entered segment-by-segment (mm/dd/yyyy) without jumping to today
- [ ] Birth date validation (required, no future dates)
- [ ] Submit disabled until birth date and other required fields are valid
- [ ] Patient timezone defaults to the clinic timezone and is not user-editable
- [ ] Form submission creates patient
- [ ] Success message shows after creation
- [ ] Redirect to patient detail after creation
- [ ] Error messages show on validation failure
- [ ] Enter key doesn't submit unless on submit button

### Patient Detail Page (`/patients/:id`)

- [ ] Patient information displays correctly
- [ ] Edit patient button visible
- [ ] Treatment history displays
- [ ] Active treatments section shows
- [ ] Completed treatments section shows
- [ ] Main concern displays for consultations
- [ ] Parent appointment links visible
- [ ] Loading states show during fetch
- [ ] Error handling for invalid patient ID
- [ ] Delete patient functionality (if implemented)

### Patient Edit

- [ ] Edit modal opens with pre-filled data
- [ ] All fields editable
- [ ] Validation works on edit
- [ ] Save changes updates patient
- [ ] Cancel button discards changes
- [ ] Error handling on save failure

---

## 📋 5. Board (`/board`)

### Walk-In Panel

- [ ] Walk-in panel visible on left side
- [ ] "New Patient" toggle works
- [ ] Patient search/select works for existing patients
- [ ] All appointment types available (Assessment, Physiotherapy, TENS)
- [ ] Priority selection works (Emergency=1, Intermediate=2, Normal=3)
- [ ] Parent appointment selector visible for existing patients
- [ ] Parent appointment selector hidden for new patients
- [ ] Parent appointment options load correctly
- [ ] Form validation works
- [ ] Create new patient + check-in flow works
- [ ] Check-in existing patient works
- [ ] Success feedback after check-in
- [ ] Error handling on failure

### Appointment Board

- [ ] All 4 sections render: Scheduled, Checked In, In Progress, Completed
- [ ] Appointments grouped by date (today, future dates)
- [ ] Manual refresh button works
- [ ] Loading states show during refresh
- [ ] Empty states show in empty sections

### Drag & Drop

- [ ] Drag appointment cards between sections
- [ ] Drop zones highlight on drag
- [ ] Status updates on drop (backend sync)
- [ ] Confirmation modal for multi-section moves
- [ ] Drag disabled when day finalized
- [ ] Drag disabled when card expanded
- [ ] Visual feedback during drag
- [ ] Invalid drops rejected (e.g., Completed → Scheduled)

### Status Transitions

- [ ] Scheduled → Checked In
- [ ] Checked In → In Progress
- [ ] In Progress → Completed
- [ ] Checked In → Scheduled (bidirectional)
- [ ] Completed → Checked In (reopening)
- [ ] Cancelled → Scheduled (rescheduling)
- [ ] Backend timestamps update correctly

### Appointment Cards

- [ ] Patient name displays
- [ ] Appointment type badge shows
- [ ] Priority indicator visible
- [ ] Time/date displays correctly
- [ ] Main concern shows (if consultation)
- [ ] Click to expand (physiotherapy/tens only)
- [ ] Delete button works
- [ ] Confirmation before delete

### Expandable Cards (Physiotherapy/TENS)

- [ ] Click card to expand
- [ ] Chevron icon changes (down/up)
- [ ] Treatment details display:
  - [ ] Treatment type badge
  - [ ] Body location(s)
  - [ ] Session duration in minutes (30, 45, or 60 — physiotherapy and TENS)
  - [ ] Session progress bar
  - [ ] Completed/Planned sessions count
  - [ ] Start and end dates
  - [ ] Treatment notes
- [ ] Only one card expanded per section
- [ ] Expansion disabled during drag
- [ ] Loading state while fetching sessions
- [ ] Error handling on fetch failure

### Day Finalization

- [ ] "End of Day" button visible
- [ ] Confirmation modal shows before finalization
- [ ] Finalization disables all editing
- [ ] Finalization marks absences as MISSED
- [ ] Finalization state persists in localStorage
- [ ] Visual feedback (opacity, disabled states)
- [ ] **No undo** - finalization is permanent
- [ ] "Day finalized" button shown when finalized

---

## 📅 6. Schedule Calendar (`/schedule`)

### Calendar View

- [ ] Calendar displays current month
- [ ] Navigate between months works
- [ ] Today's date highlighted
- [ ] Dates with appointments show count badges
- [ ] Holiday indicators show (amber badge with sparkles)
- [ ] Holiday tooltip shows name on hover
- [ ] Click date to view appointments
- [ ] Loading states during data fetch

### Schedule Columns

- [ ] Appointments grouped by date
- [ ] All columns render: Assessment, Physiotherapy, TENS
- [ ] Time slots display correctly
- [ ] Drag & drop between dates (if implemented)
- [ ] Empty states show when no appointments

### Holiday Integration

- [ ] Holidays load from backend
- [ ] Holiday badge appears on calendar dates
- [ ] Tooltip shows holiday name and description
- [ ] Automatic scheduling skips holidays
- [ ] Return weeks postpone if landing on holiday

### New Appointment Form (from Schedule)

- [ ] Modal opens from schedule
- [ ] Date pre-selected from calendar
- [ ] Patient selection works
- [ ] Parent appointment selector visible
- [ ] Parent appointment options load
- [ ] All fields validate correctly
- [ ] Create appointment succeeds
- [ ] Calendar updates after creation

---

## 🎄 7. Holiday Management (`/schedule/holidays`)

### Holiday List

- [ ] Holidays display in table format
- [ ] Year filter works (current year ± 2)
- [ ] Holidays sorted by date
- [ ] Edit button opens edit modal
- [ ] Delete button shows confirmation
- [ ] Delete removes holiday
- [ ] Empty state shows when no holidays

### Create Holiday

- [ ] "Add holiday" button opens modal
- [ ] Name field required
- [ ] Date picker works (YYYY-MM-DD format)
- [ ] Description field optional
- [ ] Date format validation (regex)
- [ ] Conflict detection prevents duplicates
- [ ] Past date validation works
- [ ] Success message after creation
- [ ] Holiday appears in list immediately

### Edit Holiday

- [ ] Modal pre-fills with holiday data
- [ ] Update name works
- [ ] Update date works
- [ ] Update description works
- [ ] Conflict detection on edit
- [ ] Save updates holiday
- [ ] Cancel discards changes

### Holiday Templates

- [ ] "Templates" tab visible
- [ ] Template list displays
- [ ] Create template button works
- [ ] Template name required
- [ ] Template entries use month/day (year-independent)
- [ ] Save template succeeds

### Apply Template

- [ ] "Apply template" button visible per template
- [ ] Year selection modal opens
- [ ] Apply template creates holidays for year
- [ ] Invalid dates skipped (e.g., Feb 31)
- [ ] Conflict detection during application
- [ ] Error report shows skipped entries
- [ ] Success message after application

### Upcoming Holidays Widget

- [ ] Widget displays on schedule page
- [ ] Shows next 5 upcoming holidays
- [ ] Holiday name and date visible
- [ ] Sorted by date (soonest first)
- [ ] Loading state while fetching
- [ ] Empty state when no upcoming holidays

---

## 💊 8. Consultations, treatments, and sessions

### Assessment Consultation Workflow

- [ ] Post-appointment modal opens after completion
- [ ] Tabbed form displays: Basic Info, General Recommendations, Treatment Recommendations, Automatic Scheduling
- [ ] Basic Info tab validates:
  - [ ] Main concern required
  - [ ] Treatment status (N / T / D / C)
  - [ ] Registration date
  - [ ] Consultation notes (optional)
- [ ] General Recommendations tab:
  - [ ] Home Exercises textarea
  - [ ] Pain Management textarea
  - [ ] Medications textarea
  - [ ] "No general recommendations" checkbox disables fields
- [ ] Treatment Recommendations tab:
  - [ ] Separate Physiotherapy and TENS tables (same columns)
  - [ ] Body location, duration (30 / 45 / 60 min), quantity, start date per row
  - [ ] Default duration: 45 min (physiotherapy), 30 min (TENS)
  - [ ] "No treatment recommendations" checkbox disables tables
- [ ] Automatic Scheduling tab:
  - [ ] Return weeks (follow-up assessment consultation)
  - [ ] Return when treatment complete option
- [ ] Tab validation status indicators (✅/⚠️/❌)
- [ ] Submit disabled until valid
- [ ] Submit creates consultation (`POST /consultations`)
- [ ] Submit updates patient status
- [ ] Discharge (D) or consecutive no-shows (C) cancels open appointments and shows cancelled list in confirmation
- [ ] Discharge date set if status = 'D'

### Treatment plan creation (physiotherapy / TENS)

- [ ] Body location multiselect works (per row)
- [ ] Search functionality in body location selector
- [ ] Multiple locations per treatment row
- [ ] Duration required for both types (30, 45, or 60 minutes)
- [ ] Quantity field for all treatments
- [ ] Start date selection (clinic timezone)
- [ ] Scheduling conflicts detected by **body location** (same patient, same date)
- [ ] Batch submission creates treatment plans (`hms_treatment`) and session rows
- [ ] Automatic scheduling to calendar
- [ ] Sessions skip holidays during scheduling

### Session progress

- [ ] Progress bars display correctly
- [ ] Completed/Planned sessions count accurate
- [ ] Session records display
- [ ] Complete session button works
- [ ] Post-treatment modal records session
- [ ] Progress updates in real-time
- [ ] Treatment completion when all sessions done

### Treatment / session deletion

- [ ] Delete button visible on session cards
- [ ] Confirmation modal shows
- [ ] Delete removes session
- [ ] Schedule updates after deletion
- [ ] Error handling on delete failure

### System settings — treatment options (`/settings/system`)

- [ ] Body locations list: create, rename, activate/deactivate
- [ ] Inactive locations cannot be selected in consultation forms (clear error message)
- [ ] Schedule settings (hours, concurrency) unchanged

---

## 🔄 9. Parent Appointment Tracking

### Parent Appointment Linking

- [ ] Parent selector visible in walkIn form
- [ ] Parent selector visible in schedule form
- [ ] Only root consultations shown as options
- [ ] Options sorted by date (most recent first)
- [ ] Format: "YYYY-MM-DD - Main Concern"
- [ ] Loading state while fetching
- [ ] Selection clears on patient change
- [ ] Selection clears on new patient toggle
- [ ] Optional field (can be left blank)
- [ ] Parent ID sent to backend on creation

### Parent Chain Maintenance

- [ ] Follow-ups link to original consultation
- [ ] Physiotherapy sessions link to parent consultation
- [ ] TENS sessions link to parent consultation
- [ ] Children inherit parent (not intermediate appointment)
- [ ] Backend maintains parent chain automatically

---

## 🎨 10. UI Components

### Modals

- [ ] Base modal opens/closes correctly
- [ ] Tabbed modal tabs switch
- [ ] Multi-section modal confirms dangerous actions
- [ ] Confirmation modal shows before delete/finalize
- [ ] Close button works
- [ ] Click outside closes (if applicable)
- [ ] ESC key closes modal
- [ ] Modal overlay visible

### Forms

- [ ] Input fields accept text
- [ ] Textarea expands correctly
- [ ] Date pickers work
- [ ] Dropdown/select works
- [ ] Switch toggles work
- [ ] Multiselect works
- [ ] Search input filters options
- [ ] Validation errors display inline
- [ ] Form submit buttons enabled/disabled correctly

### Buttons

- [ ] Primary buttons styled correctly
- [ ] Secondary buttons styled correctly
- [ ] Danger buttons (delete) styled correctly
- [ ] Loading states show spinner
- [ ] Disabled states prevent clicks
- [ ] Icon buttons have proper tooltips

### Loading States

- [ ] LoadingFallback component displays
- [ ] Loading spinners show during async operations
- [ ] Skeleton screens display during initial load
- [ ] Loading messages customizable
- [ ] Size variations work (small/medium/large)

### Feedback

- [ ] Toast notifications appear
- [ ] Success toasts display
- [ ] Error toasts display
- [ ] Warning toasts display
- [ ] Toasts auto-dismiss after timeout
- [ ] Toast close button works

---

## 🧪 12. Error Handling

### API Errors

- [ ] Network errors show user-friendly messages
- [ ] 400 errors show validation messages
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied
- [ ] 404 errors show not found
- [ ] 500 errors show server error message
- [ ] Retry mechanism works for failed requests

### Form Validation

- [ ] Required field errors display
- [ ] Format validation errors display (phone, date, email)
- [ ] Custom validation messages in Portuguese
- [ ] Errors clear when field corrected
- [ ] Submit prevented when invalid

### Data Integrity

- [ ] Duplicate prevention (holidays, patients)
- [ ] Conflict detection works
- [ ] Orphaned data handling
- [ ] Cascade delete warnings
- [ ] Transaction rollback on error

---

## 📱 13. Responsive Design

> Mobile HMS patterns are in [.cursor/rules/09-styling-responsive.mdc](../.cursor/rules/09-styling-responsive.mdc) and [ARCHITECTURE.md](./ARCHITECTURE.md) § Responsive Rules. **Layout work is implemented in code** (2026-06-01). Use the checklists below for **manual QA before each release** at **320px, 375px, 768px, and 1024px** (Chrome device mode + one real device when possible). HMS does **not** require touch drag-and-drop on appointment (optional follow-up).

### Implemented in codebase (mobile HMS)

| Area                | What shipped                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Shell               | `TabNav` 44px + scroll-snap; `TopNavigation` touch targets; `main` flex min-height                                     |
| Appointment          | `grid-cols-1 md:2 lg:4` columns; `MobileDesktopDnDAlert` below `lg`; legend wrap                                       |
| Modals              | `BaseModal` (`max-h-[90dvh]`); custom shells migrated; `TabbedModal` scrollable tabs                                   |
| Patients            | List cards `< md`; detail FAB (menu opens upward) + desktop section rail `lg+`; card headers; forms `grid-cols-1 md:*` |
| Schedule / holidays | Stacked columns; holiday/template cards; filter touch targets                                                          |
| Settings / login    | User cards; stacked settings tables; login `max-w-sm`                                                                  |
| Dense tables        | `stackedTableClasses` + `TableMobileLabel` in `@/components/ui/Table.tsx`                                              |

### Mobile (< 640px) — release QA

- [ ] Top navigation: labels truncate; user menu opens; no overflow
- [ ] Tab navigation: 44px targets; horizontal scroll if needed; active tab visible
- [ ] `/board`: columns stack vertically; no page-level horizontal scroll; DnD banner visible below `lg`
- [ ] `/patients`: card list readable; tap opens detail; sort toolbar works
- [ ] `/patients/[id]`: section FAB reachable; FAB menu opens upward and all section labels visible; desktop rail (`lg+`) icons/labels align; cards and history items wrap; no clipped actions
- [ ] `/schedule`: filters and columns usable; patient rows stack in columns
- [ ] Settings (`/settings/*`): user cards; system tables stack; profile tabs scroll
- [ ] `/login`: form fits 320px; inputs and Sign In button usable
- [ ] Modals: fit viewport; body scrolls inside modal; close control reachable
- [ ] Touch targets: primary actions ≥ 44px (buttons, `IconButton`, tab nav)
- [ ] Appointment status changes on phone: read-only layout OK; DnD remains desktop (`MobileDesktopDnDAlert`) — touch DnD **not** HMS (optional follow-up)
- [ ] No unintended horizontal scroll on `/board`, `/schedule`, `/patients`

### Tablet (640px – 1024px) — release QA

- [ ] Appointment: two-column board at `md`; four columns at `lg`
- [ ] Patient list: table from `md`; ID column from `sm`
- [ ] Touch targets adequate on filters and toolbars
- [ ] Navigation and modals usable in portrait and landscape

### Desktop (> 1024px) — release QA

- [ ] Full Kanban (four columns) and desktop patient side nav
- [ ] Max-width constraint (`max-w-[1200px]`) centered
- [ ] Drag & drop smooth on appointment board
- [ ] Hover states on tables and cards

---

## ⚡ 14. Performance

### Bundle Size

- [ ] Main bundle < 300kB
- [ ] Code splitting implemented
- [ ] Route-level lazy loading works
- [ ] Modal lazy loading works
- [ ] Suspense boundaries in place

### Loading Performance

- [ ] Initial page load < 3s
- [ ] Time to interactive < 5s
- [ ] API preconnect configured
- [ ] DNS prefetch configured
- [ ] Images optimized (if applicable)

### Runtime Performance

- [ ] No infinite loops (useEffect dependencies correct)
- [ ] Callbacks memoized with useCallback
- [ ] React Query caching working
- [ ] Zustand state updates efficient
- [ ] No unnecessary re-renders
- [ ] Drag & drop smooth (60fps)

### Optimization Techniques

- [ ] React Query stale/cache times configured
- [ ] Query invalidation specific (not broad)
- [ ] LocalStorage used only for explicit UI state, not timezone selection
- [ ] Debounced search inputs
- [ ] Pagination for large lists

---

## 🔒 15. Data Persistence

### LocalStorage

- [ ] No timezone preference persists across sessions
- [ ] Day finalization state persists
- [ ] User preferences saved
- [ ] Clear on logout

### Backend Sync

- [ ] Appointment status updates sync
- [ ] Patient data updates sync
- [ ] Treatments and sessions sync
- [ ] Timestamps accurate
- [ ] Optimistic updates revert on failure

---

## 🧩 16. Edge Cases

### Appointment Management

- [ ] Empty sections display correctly
- [ ] Drag to same section (no-op)
- [ ] Drag while loading (disabled)
- [ ] Concurrent updates handled
- [ ] Invalid status transitions rejected
- [ ] Delete last appointment in section
- [ ] Multiple appointments same patient/date

### Patient Management

- [ ] Patient with no appointments
- [ ] Patient with 100+ appointments
- [ ] Duplicate patient names allowed
- [ ] Patient deletion with active appointments blocked
- [ ] Patient with no timezone defaults to the clinic timezone

### Treatments and sessions

- [ ] Session with 0 quantity
- [ ] Session with 100+ quantity
- [ ] Session start date in past (validation)
- [ ] Session end date before start date (validation)
- [ ] Delete session with completed records
- [ ] Complete already-completed session (prevented)

### Holiday Management

- [ ] Holiday on Feb 29 (leap year handling)
- [ ] Template with Feb 31 (skipped during apply)
- [ ] Duplicate holiday dates prevented
- [ ] Past holiday creation (validation)
- [ ] Holiday on same date as appointment (scheduling postpones)

### Calendar/Schedule

- [ ] Month with no appointments
- [ ] Date with 50+ appointments
- [ ] Navigate to future years
- [ ] Navigate to past years
- [ ] Leap year handling (Feb 29)

### Timezone Edge Cases

- [ ] Daylight saving time transitions
- [ ] Midnight boundary (23:59 → 00:00)
- [ ] Date changes across timezones
- [ ] UTC±0 timezone
- [ ] Half-hour offset timezones (Asia/Kolkata)

---

## 🧪 17. Testing Infrastructure

### Unit Tests

- [ ] 3491+ tests passing (full `npm test` suite)
- [ ] All new features have tests
- [ ] Coverage tracked via `npm test -- --coverage` (~81% statements on full `src/` run)
- [ ] Shared physiotherapy test fixtures used where applicable (`src/testFixtures/physiotherapyContext.ts`)

### Test Organization

- [ ] All tests in `__tests__/` folders
- [ ] Naming convention followed
- [ ] Component tests cover rendering
- [ ] Hook tests cover logic
- [ ] Service tests cover API calls

### Test Quality

- [ ] Edge cases tested
- [ ] Error states tested
- [ ] Loading states tested
- [ ] User interactions tested
- [ ] Accessibility tested

---

## ♿ 18. Accessibility

### Keyboard Navigation

- [ ] Tab navigation works throughout
- [ ] Focus visible on all interactive elements
- [ ] Enter key activates buttons/links
- [ ] ESC key closes modals
- [ ] Arrow keys work in dropdowns/selects
- [ ] Skip to main content link (if implemented)

### Screen Readers

- [ ] `aria-label` on icon buttons
- [ ] `aria-current` on active navigation
- [ ] `aria-expanded` on collapsible sections
- [ ] `aria-controls` on interactive elements
- [ ] Form labels associated with inputs
- [ ] Error messages announced

### Visual

- [ ] Color contrast WCAG AA compliant
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] No information conveyed by color alone
- [ ] Alt text on images (if applicable)

---

## 📊 19. Monitoring & Debugging

### Console

- [ ] No console.log in production
- [ ] No console errors in normal operation
- [ ] API errors logged (dev mode)
- [ ] React errors caught by error boundaries

### DevTools

- [ ] React DevTools shows component tree
- [ ] Redux DevTools (if used)
- [ ] Network tab shows API calls
- [ ] Performance tab usable

---

## 🚀 20. Deployment

### Build

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Build output optimized

### Production

- [ ] App loads in production
- [ ] API calls work in production
- [ ] Environment variables set correctly
- [ ] CORS configured correctly
- [ ] HTTPS enabled (if applicable)

### Monitoring

- [ ] Error tracking configured (if applicable)
- [ ] Performance monitoring (if applicable)
- [ ] Uptime monitoring (if applicable)

---

## 📝 Testing Tips

### Manual Testing Workflow

1. **Start with authentication** - Ensure login works
2. **Test navigation** - Visit all pages
3. **Test CRUD operations** - Create, read, update, delete entities
4. **Test workflows** - Complete multi-step processes
5. **Test edge cases** - Try unusual inputs and scenarios
6. **Test error handling** - Force errors and verify recovery
7. **Test responsive design** - Resize browser, use device emulator
8. **Test performance** - Monitor loading times, check network tab

### Automated Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- patients/PatientForm.test.tsx
```

### Regression Testing

- Use this checklist after every significant change
- Focus on affected areas and integration points
- Test happy path + common edge cases
- Verify no new console errors
- Check test suite still passes

### Bug Reporting

When you find an issue:

1. ✅ **Document** - Note exact steps to reproduce
2. 📸 **Screenshot** - Capture the issue
3. 🔍 **Console** - Check for errors in browser console
4. 🌐 **Network** - Check API calls in network tab
5. 🎯 **Context** - Note browser, screen size, user state

---

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [Project README](../README.md)
- [Backend README](../hms-backend/README.md)

---

**Last Updated:** 2026-06-23
**Total Test Cases:** 400+ manual checklist items; 3491 automated Jest tests
**Coverage Target:** ~81%+ statements (see `npm test -- --coverage`)
**Pass Rate Target:** 100% on CI / local full suite
