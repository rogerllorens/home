-- Preview daily limits, platform export file types and admin reservation safety.
-- Run after 008_production_job_creation_hardening.sql.

alter table public.downloads drop constraint if exists downloads_file_type_check;
alter table public.downloads add constraint downloads_file_type_check check (file_type in (
  'rankelia_csv','shopify_csv','woocommerce_csv','prestashop_csv','html_report','txt_report','errors_csv',
  'csv_shopify','csv_prestashop','csv_woocommerce','csv_generic','html','report_txt'
));

create index if not exists audit_events_user_action_created_idx on public.audit_events(user_id, action, created_at desc);
create index if not exists credit_reservations_job_status_idx on public.credit_reservations(job_id, status);
