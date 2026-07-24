CREATE TABLE `attendance_records` (
	`booking_id` text PRIMARY KEY NOT NULL,
	`outcome` text DEFAULT 'pending' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`marked_by_user_id` text,
	`marked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`delegate_id` text NOT NULL,
	`course_id` text NOT NULL,
	`issued_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`file_key` text,
	`emailed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delegate_id`) REFERENCES `delegates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_booking_id_unique` ON `certificates` (`booking_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`delegate_id` text NOT NULL,
	`course_id` text NOT NULL,
	`amount_pence` integer NOT NULL,
	`issued_date` text,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`paid_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delegate_id`) REFERENCES `delegates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_booking_id_unique` ON `invoices` (`booking_id`);
--> statement-breakpoint
INSERT INTO `attendance_records` (`booking_id`, `outcome`, `marked_at`, `created_at`, `updated_at`)
SELECT `id`, CASE WHEN `attendance_marked` = 1 THEN 'attended' ELSE 'pending' END,
  CASE WHEN `attendance_marked` = 1 THEN `updated_at` ELSE NULL END, `created_at`, `updated_at`
FROM `bookings`;
--> statement-breakpoint
INSERT INTO `invoices` (`id`, `booking_id`, `delegate_id`, `course_id`, `amount_pence`, `issued_date`, `due_date`, `status`, `created_at`, `updated_at`)
SELECT b.`invoice_id`, b.`id`, b.`delegate_id`, b.`course_id`, COALESCE(c.`price_pence`, 0),
  b.`booking_date`, date(b.`booking_date`, '+30 days'), 'issued', b.`created_at`, b.`updated_at`
FROM `bookings` b JOIN `courses` c ON c.`id` = b.`course_id`
WHERE b.`invoice_id` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `certificates` (`id`, `booking_id`, `delegate_id`, `course_id`, `issued_date`, `status`, `created_at`, `updated_at`)
SELECT b.`certificate_id`, b.`id`, b.`delegate_id`, b.`course_id`,
  CASE WHEN b.`attendance_marked` = 1 THEN b.`updated_at` ELSE NULL END,
  CASE WHEN b.`attendance_marked` = 1 THEN 'available' ELSE 'pending' END,
  b.`created_at`, b.`updated_at`
FROM `bookings` b WHERE b.`certificate_id` IS NOT NULL;
