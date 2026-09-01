# FolioDesk website and affiliate portal

Full-stack Next.js website with MySQL-backed affiliate registration, applicant status, administrator review, approval/rejection, affiliate code issuance, sessions and audit history.

## Local setup

1. Install Node.js 22+ and pnpm.
2. Copy `.env.example` to `.env.local` and replace all credentials for non-local use.
3. Start MySQL: `docker compose up -d db` (or point `DATABASE_URL` at a managed MySQL 8 database).
4. Install dependencies: `pnpm install`.
5. Create tables and the admin: `pnpm db:setup`.
6. Start the site: `pnpm dev`.
7. Visit `http://localhost:3000`.

## Local administrator

- URL: `http://localhost:3000/login`
- Email: `admin@foliodesk.local`
- Initial local password: `ChangeMe!FolioDesk2026`

Change the values in `.env.local`, rerun `pnpm db:seed-admin`, and never use the included local password in production.

## Primary routes

- `/` — FolioDesk marketing site
- `/affiliates` — public affiliate programme
- `/register` — affiliate application
- `/login` — applicant/admin login
- `/portal` — applicant status and approved affiliate code
- `/admin` — programme administration

## Production checklist

- Use managed MySQL with TLS, automated backups and point-in-time recovery.
- Replace `SESSION_SECRET` and administrator credentials.
- Put the site behind HTTPS.
- Add transactional email for verification and status notifications.
- Finalise and version the Affiliate Agreement before announcing commission terms.
- Add rate limiting, MFA for administrators and upload storage before accepting identity documents.
