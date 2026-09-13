# FolioDesk DigitalOcean migration runbook

## Target topology

- Separate App Platform apps for staging and production in the Singapore (`sgp`) region.
- Separate Managed MySQL 8.4 clusters/databases and database users.
- Separate private Spaces buckets for identity documents and payment evidence.
- GitHub `staging` branch autodeploys to staging; production uses `main` with autodeploy disabled.
- A pre-deploy job applies the idempotent baseline schema and verifies critical tables and columns.

## Required values before creating either app

Replace every `REPLACE_WITH_...` value in the applicable `.do/app-*.yaml` file. Use different credentials and buckets for staging and production. Do not commit actual values.

The `NEXT_PUBLIC_SITE_URL` placeholders must be replaced with the final environment URLs. Keep `/foliodesk` while the application retains its configured Next.js base path.

## Staging sequence

1. Push the reviewed migration branch to GitHub and create a dedicated `staging` branch.
2. Create a private staging Space and a staging-only Spaces access key.
3. Create or attach a staging Managed MySQL 8.4 cluster in `sgp1`.
4. Import a sanitized or explicitly approved production snapshot into `foliodesk_staging`.
5. Replace app-spec placeholders and create `foliodesk-staging` from `.do/app-staging.yaml`.
6. Confirm `/foliodesk/api/health` returns HTTP 200.
7. Run `npm run db:verify` and `npm run db:reconcile` against the staged copy.
8. Exercise registration, referral attribution, admin approval, collection approval, commission advice creation, payout batching, refund/cancellation behavior, and upload retrieval.

## Production cutover gate

Do not proceed unless all of these are true:

- The reviewed branch is merged and the production build passes.
- Staging functional tests pass using non-production accounts and funds.
- Source and target reconciliation reports have zero count and monetary differences.
- Duplicate advice groups, paid advices without batches, and approved collections without advice are investigated and resolved.
- Production Spaces objects have been copied and verified before database paths are made live.
- DNS TTL has been lowered in advance, rollback ownership is assigned, and a final backup is restorable.
- A human explicitly approves maintenance mode, final database export/import, production app creation/update, and DNS cutover.

## Cutover and rollback

1. Put the source system into maintenance/read-only mode.
2. Take and verify the final MySQL backup; retain routines, triggers, events, and consistent transactional state.
3. Import to the production Managed MySQL cluster and run schema verification.
4. Copy uploads to the production Space and verify object counts/checksums.
5. Run source-versus-target reconciliation; require zero differences for money and core table counts.
6. Start the production app without changing DNS and complete smoke tests on its default URL.
7. Change DNS only after sign-off.
8. If a gate fails, restore DNS to the source, keep the target isolated, and preserve both databases for diagnosis. Do not delete the old environment during the rollback window.
