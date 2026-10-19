-- Runs after the local auth stub and before the migrations.
-- Simulates a Supabase Auth user who already exists when the schema is applied.

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'existing.auth@example.com',
  '{"role":"admin","is_admin":true,"full_name":"Existing Customer","phone":"01222222222"}'::jsonb
);
