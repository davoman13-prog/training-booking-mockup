CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`delegate_id` text NOT NULL,
	`course_id` text NOT NULL,
	`session_id` text NOT NULL,
	`location_id` text NOT NULL,
	`booking_date` text NOT NULL,
	`status` text NOT NULL,
	`payment_required` integer NOT NULL,
	`terms_accepted` integer NOT NULL,
	`special_requirements` text,
	`attendance_marked` integer DEFAULT false NOT NULL,
	`invoice_id` text,
	`certificate_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`delegate_id`) REFERENCES `delegates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `delegates` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`organisation` text NOT NULL,
	`manager_name` text NOT NULL,
	`manager_email` text NOT NULL,
	`account_status` text DEFAULT 'active' NOT NULL,
	`admin_notes` text DEFAULT '' NOT NULL,
	`special_requirements` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delegates_email_unique` ON `delegates` (`email`);