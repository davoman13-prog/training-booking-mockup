ALTER TABLE `courses` ADD `audience_types` text DEFAULT '["manager","office","clinical"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `delegates` ADD `staff_type` text DEFAULT 'clinical' NOT NULL;