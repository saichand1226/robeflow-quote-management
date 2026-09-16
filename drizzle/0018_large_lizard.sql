ALTER TABLE `quotes` ADD `accounts_approved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `dispatch_status` text DEFAULT 'Awaiting dispatch' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `tracking_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `tracking_sent_at` text;