CREATE TABLE `waiting_list_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`delegate_id` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`delegate_id`) REFERENCES `delegates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waiting_list_delegate_course_unique` ON `waiting_list_entries` (`delegate_id`,`course_id`);