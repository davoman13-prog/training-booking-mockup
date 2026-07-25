CREATE INDEX `attendance_outcome_idx` ON `attendance_records` (`outcome`);--> statement-breakpoint
CREATE INDEX `bookings_delegate_status_idx` ON `bookings` (`delegate_id`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_session_status_idx` ON `bookings` (`session_id`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_course_status_idx` ON `bookings` (`course_id`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_date_idx` ON `bookings` (`booking_date`);--> statement-breakpoint
CREATE INDEX `certificates_delegate_status_idx` ON `certificates` (`delegate_id`,`status`);--> statement-breakpoint
CREATE INDEX `delegates_account_status_idx` ON `delegates` (`account_status`);--> statement-breakpoint
CREATE INDEX `delegates_name_idx` ON `delegates` (`last_name`,`first_name`);--> statement-breakpoint
CREATE INDEX `invoices_status_due_idx` ON `invoices` (`status`,`due_date`);--> statement-breakpoint
CREATE INDEX `sessions_course_status_date_idx` ON `sessions` (`course_id`,`status`,`start_date`);--> statement-breakpoint
CREATE INDEX `sessions_location_status_date_idx` ON `sessions` (`location_id`,`status`,`start_date`);--> statement-breakpoint
CREATE INDEX `sessions_trainer_status_date_idx` ON `sessions` (`trainer_id`,`status`,`start_date`);--> statement-breakpoint
CREATE INDEX `waiting_list_course_created_idx` ON `waiting_list_entries` (`course_id`,`created_at`);