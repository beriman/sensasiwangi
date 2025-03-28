-- Create a cron job to check for expired sambatans every hour
SELECT cron.schedule(
  'check-expired-sambatans',
  '0 * * * *',  -- Run every hour at minute 0
  $$
  SELECT
    supabase_functions.http_request(
      'POST',
      CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/check_expired_sambatans'),
      '{}'::jsonb,
      'application/json',
      jsonb_build_object(
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key'))
      )
    );
  $$
);
