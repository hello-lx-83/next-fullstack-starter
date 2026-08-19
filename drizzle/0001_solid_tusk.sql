CREATE TABLE `audit_event` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`outcome` text DEFAULT 'success' NOT NULL,
	`actor_user_id` text,
	`target_type` text,
	`target_id` text,
	`request_id` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_event_actor_created_idx` ON `audit_event` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_event_action_created_idx` ON `audit_event` (`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_event_target_idx` ON `audit_event` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);