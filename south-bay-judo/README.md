# South Bay Judo — Registration, Payments & Roster

This started as a pure design/UX review build and has grown real
functionality since: registrations save to a roster (Google Sheets), Stripe
Checkout collects payment, Stripe webhooks mark the roster paid and trigger
the final receipt, and the admin page can edit live site settings. Deploys to
Vercel from GitHub; the backend connections are described below.

## Stripe Checkout setup

The registration API creates one-time Stripe Checkout Sessions from prices
recalculated on the server. Cards, Apple Pay, Google Pay, and US bank accounts
are enabled. Stripe webhook events automatically update every student row in
the registration batch and send the paid receipt to the parent(s), with the
staff address blind-copied.

Set these Vercel environment variables:

- `STRIPE_SECRET_KEY` — the sandbox secret key while testing; replace with the
  live account key only when South Bay Judo is ready to accept real payments.
- `STRIPE_WEBHOOK_SECRET` — signing secret for the webhook endpoint below.

Create a Stripe webhook endpoint at:

`https://<production-domain>/api/webhooks/stripe`

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

The Google registration sheet grows four columns automatically: Receipt
Number, Payment Status, Stripe Checkout Session ID, and Receipt JSON. Existing
rows remain compatible.

## Pricing model
This matches the club's actual fee schedule, not a simplified placeholder:

- **Regular sessions (1Q–4Q)** charge per family, tiered by how many kids
  from the same family are enrolling in that session: 1st student full
  price, 2nd cheaper, 3rd+ cheapest. Configurable per session in
  `/admin` → Site Settings.
- **Returning students** joining after a session has started, transferring
  from another club, or coming back after a break are prorated at
  **$10/class** instead of the tiered price, capped at the 1st-student
  price. The registration form asks for "classes remaining" to compute
  this.
- **The Holiday session** is flat-priced (not family-tiered) — it's a
  different kind of program.
- **USJF** is the required national federation (not USA Judo — confirmed
  against the club's actual guest-registration and fee-schedule
  documents). USA Judo is still selectable for students who
  hold those instead. **USJF membership is not sold through this site** —
  the club decided against collecting for it here, since USJF handles
  that directly (and no longer offers day passes). The form asks whether
  a student has a current membership purely for insurance record-keeping;
  if not, they're told to register directly at usjf.org before their
  first class. `MEMBERSHIP_FEE` and `familyMembershipFee()` still exist
  in `lib/sessions.ts` for reference but aren't charged anywhere.
- **USJF number lookup**: the membership step lets a parent search their
  name against the club's actual USJF roster (a separate Google Sheet —
  see "Setting up USJF lookup" below) and auto-fills their member number
  and expiration date if found, with a clear expired/current alert. If no
  match, they can enter it manually or add a USA Judo membership
  instead.
- **Optional gear add-ons**: a gi (per student, by size) and practice
  dummies / duffle bags (family-level, added once at checkout). Pricing
  for these lives in `lib/sessions.ts` (`GI_SIZES`, `DUMMY_SIZES`,
  `DUFFLE_SIZES`) — not yet editable from `/admin`, since that would mean
  a lot more admin-page surface for items that change rarely. Worth
  adding there if gear pricing turns out to change often.

**Simplification worth knowing:** family-level extras (gear orders) are
recorded as one combined note on the first student's roster row per
registration, not as fully separate line items — see the comment in
`lib/sheets.ts` for why, and reconsider if you ever need to report on
gear orders independently.

### Setting up USJF lookup (one-time)
The membership step's name search needs its own Google Sheet — separate
from the registrations roster — holding the club's actual USJF export.

1. Take the USJF membership export file (the one with columns Name,
   Expires, ID, Verified Dan Rank, DOB, YDK, Dojo, Type, Auto-Renews) and
   upload it into Google Drive, then open it — Drive converts `.xlsx` to
   a Google Sheet automatically, or you can choose File → Save as Google
   Sheets. No reformatting needed; the columns already match what the app
   expects.
2. Share that Sheet with the **same service account** you set up for the
   roster (its email again looks like
   `something@your-project.iam.gserviceaccount.com`) as a **Viewer** —
   this one only needs to be read, never written to.
3. Add one more environment variable: `GOOGLE_USJF_SHEET_ID` = the ID
   from that Sheet's URL (same place you got `GOOGLE_SHEET_ID` from,
   just a different sheet).
4. Redeploy. Until this is set up, the search box simply shows no
   results — everything else in the form still works, falling back to
   manual entry.

To keep it current, re-upload a fresh USJF export into that same Sheet
whenever the club gets an updated one (replace its contents, keep the
same Sheet/ID) — no code or redeploy needed, since the app reads it live
each time (cached for 5 minutes to keep searches fast).

## Updating dates, prices, and class times
There are two ways to do this now:

**1. The admin page (`/admin`)** — the easiest way for a non-technical
admin. Enter the password, edit any field, click Save, and the live site
updates within seconds. No code, no GitHub, no redeploy.

**2. Editing `lib/sessions.ts` directly** — this file still exists as the
*fallback* defaults (used if Global Config isn't connected yet, e.g. in
local dev). It's no longer what the live site reads from once Global
Config is set up, but it's a useful reference for the shape of the data.

### Setting up the roster (one-time)
The admin page's **Roster** tab shows every submitted registration — student
info, guardian and emergency contacts, medical notes, insurance/membership
status (flagged if there's a gap), and a paid/unpaid toggle. This runs on
a **Google Sheet living in Drive**, not a separate database — you can open
it directly in Google Sheets anytime to eyeball everything, print it, or
hand it to an instructor.

1. Create a new Google Sheet (anywhere in your Drive) — name it something
   like "South Bay Judo Registrations." Leave it empty; the app fills in
   the header row automatically.
2. In [Google Cloud Console](https://console.cloud.google.com), create a
   project (or use an existing one), then **enable the Google Sheets API**
   for it.
3. Under **APIs & Services → Credentials**, create a **Service Account**.
   Open it, go to the **Keys** tab, and create a new JSON key — this
   downloads a `.json` file.
4. Back in your Google Sheet, click **Share**, and share it with the
   service account's email address (looks like
   `something@your-project.iam.gserviceaccount.com` — find it in the JSON
   key file or the service account's page) as an **Editor**.
5. In Vercel Project Settings → Environment Variables, add:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` = the *entire contents* of that JSON key
     file, pasted as one line
   - `GOOGLE_SHEET_ID` = the long ID in the Sheet's URL, e.g. the part
     between `/d/` and `/edit` in
     `docs.google.com/spreadsheets/d/THIS_PART/edit`
6. Redeploy.

Until that's done, submitting `/register` will show a small note on the
confirmation screen that it wasn't saved, and the Roster tab will show a
"Google Sheets isn't connected yet" message — everything else keeps
working off the `lib/sessions.ts` defaults in the meantime.

**Note on "paid" status:** every registration starts as unpaid. Stripe
webhooks mark it paid automatically after a successful payment; the admin
can still correct the status manually from the roster when needed.

**Note on scale:** the Google Sheets API has lower rate limits than a
real database — completely fine for a club doing sign-ups a few times a
year, but worth knowing if this ever needs to handle high-volume,
simultaneous traffic (unlikely here).

**A note on the data itself:** this sheet holds real names, contact info,
and medical notes once people start using it for real. Treat the admin
password — and who you've shared the Sheet with directly — like you would
any other access to sensitive family data.

### Setting up registration confirmations and USJF reminder emails (one-time)
Every successfully saved registration emails the primary guardian (and the
second guardian when an email was provided) a detailed registration receipt.
Staff receive a blind copy at `info@southbayjudo.com` by default, and the admin
roster highlights every gi and family gear/apparel purchase with sizes and
prices. Set `REGISTRATION_BCC` to use a different staff receipt address.
Paid receipts are sent after Stripe confirms payment. The "Send reminder"
button on flagged roster cards also emails the guardian about a missing,
incomplete, or expired USJF membership — both features use
[Resend](https://resend.com), not any Google service.

1. Create a Resend account (free tier: 3,000 emails/month, plenty for a
   club).
2. Add and verify the `southbayjudo.com` domain in Resend's dashboard —
   it'll give you a few DNS records (TXT/CNAME) to add. Since the club's
   domain is on Google Workspace, add these through Google Domains/DNS
   settings (wherever `southbayjudo.com`'s DNS is actually managed —
   check with whoever set that up if you're not sure).
3. Generate an API key in Resend.
4. In Vercel → Environment Variables, add `RESEND_API_KEY` with that key.
   Optionally add `EMAIL_FROM` to override the default sender (currently
   `South Bay Judo <info@southbayjudo.com>`).
5. Redeploy.

Until domain verification finishes, Resend will reject sends from
`@southbayjudo.com` — the button will show the error inline rather than
failing silently.

Registration confirmations include the student/session selections, gear,
amount due, receipt number, and payment status. Medical details are excluded
from email. Stripe webhooks change the payment status to Paid after a
successful charge.


The admin page needs a small persistent store (not a full database) to
save changes to. Vercel's **Global Config** is built for exactly this —
small, frequently-read config data.

1. In the Vercel project → **Storage** tab → **Create Database** →
   **Global Config** (may still be labeled "Edge Config" depending on
   your dashboard version). Name it anything, e.g. `south-bay-judo-config`.
   Connect it to this project — this auto-adds a connection env var, but
   we use two simpler ones instead (below), so that connection var can be
   ignored.
2. On the Global Config's page, copy its **ID** (starts with `ecfg_`) and
   generate a **read access token**. In Project Settings → Environment
   Variables, add:
   - `GLOBAL_CONFIG_ID` = that ID
   - `GLOBAL_CONFIG_READ_TOKEN` = that read token
3. Generate a **Vercel personal access token** (Account Settings → Tokens)
   with access to this team/project. Add it as:
   - `VERCEL_API_TOKEN` = that token
   (This is only used server-side, in the admin save API route — it's
   never sent to the browser.)
4. Pick a passcode for the admin page and add it as:
   - `ADMIN_PASSWORD` = whatever you want it to be
5. Redeploy. Visit `/admin`, enter the password, and you're editing.

Until steps 1–4 are done, `/admin` will show a "Global Config isn't
connected yet" error on save — the rest of the site keeps working fine
off the `lib/sessions.ts` defaults in the meantime.

## What's in here
- `/` — home page
- `/schedule` — 2026 session dates & class times
- `/register` — full session registration flow (session → student info →
  membership → waiver e-signature → review → confirmation)
- `/visitor` — drop-in visitor check-in (waiver only)

## Run locally
```bash
npm install
npm run dev
```

## Deploy
Push to GitHub, then "Add New Project" in Vercel and import the repo — no
configuration needed, it'll build and deploy as-is.

## Going from demo → production
The full version (Stripe checkout, Postgres via Prisma, Google Drive
filing, email confirmations) was scaffolded first and stripped out of this
build on purpose to keep the review link dependency-free. Once the design
here is approved, the next step is wiring `/register` and `/visitor` back
up to real API routes + a database + Stripe + Drive — ask and I'll rebuild
that version with this same styling.

### Auto-renew (added to the review step)
The review step now has an "Auto-renew for [next session]" checkbox. In
the real build this should NOT be a plain Stripe Subscription, because
session dates/prices/eligibility (the Holiday session is returning-only
and priced differently) don't follow a fixed calendar interval. Better
approach:
- Save the card via a Stripe SetupIntent / Customer with a default
  payment method at signup.
- When the next session's registration window opens, send the family an
  email to reconfirm class time + re-affirm the waiver (a full skip isn't
  advisable for liability reasons — at minimum a "nothing has changed"
  click-through).
- Trigger an off-session PaymentIntent against the saved card once
  confirmed (or after a no-response deadline, per the club's policy).
- Needs a parent account/login so they can view and cancel auto-renew
  themselves — this pulls in the "Auth" item already on the production
  TODO list.
