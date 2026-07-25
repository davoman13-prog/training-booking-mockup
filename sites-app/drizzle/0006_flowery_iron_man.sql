CREATE TABLE `auth_email_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`account_type` text NOT NULL,
	`account_id` text NOT NULL,
	`purpose` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`consumed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `delegate_auth_accounts` ADD `email_verified_at` text;
--> statement-breakpoint
UPDATE `delegate_auth_accounts` SET `email_verified_at` = CURRENT_TIMESTAMP;
