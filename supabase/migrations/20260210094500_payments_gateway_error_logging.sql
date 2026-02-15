-- Add structured gateway error logging for payment attempts.
-- This helps diagnose cases like Paystack risk/fraud denials ("unprocessed_transaction").

alter table if exists public.payments
  add column if not exists gateway_response jsonb,
  add column if not exists error_code text,
  add column if not exists error_message text;

