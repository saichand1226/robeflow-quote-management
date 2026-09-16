ALTER TABLE `quotes` ADD `service_type` text DEFAULT 'Pick Up' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `service_price` real DEFAULT 0 NOT NULL;