INSERT INTO `users`
  (`id`, `email`, `first_name`, `last_name`, `role`, `is_active`, `is_anonymised`, `created_at`, `updated_at`)
SELECT
  'user-karen-kalu-admin', 'karen@kalu.co.uk', 'Karen', '', 'Admin', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM `delegates` WHERE lower(`email`) = 'karen@kalu.co.uk'
)
ON CONFLICT(`email`) DO UPDATE SET
  `first_name` = CASE WHEN trim(`users`.`first_name`) = '' THEN 'Karen' ELSE `users`.`first_name` END,
  `role` = 'Admin',
  `is_active` = 1,
  `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `admin_auth_accounts`
  (`user_id`, `password_hash`, `password_salt`, `failed_attempts`, `password_updated_at`, `created_at`, `updated_at`)
SELECT
  `id`,
  'aaa4upDK8RXtNLFYEZcm_agpERql4w6T178PnEjDFKE',
  'Hkn5BSvXG96YQ4HdRfUfrQ',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM `users`
WHERE `email` = 'karen@kalu.co.uk'
  AND NOT EXISTS (
    SELECT 1 FROM `delegates` WHERE lower(`email`) = 'karen@kalu.co.uk'
  )
ON CONFLICT(`user_id`) DO NOTHING;
