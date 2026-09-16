CREATE TABLE `company_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`company_name` text DEFAULT 'QuoteFlow Wardrobes' NOT NULL,
	`subtitle` text DEFAULT 'Custom wardrobe solutions' NOT NULL,
	`gst_number` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT 'Christchurch, New Zealand' NOT NULL,
	`bank_details` text DEFAULT '' NOT NULL,
	`default_validity_days` integer DEFAULT 30 NOT NULL,
	`deposit_percent` real DEFAULT 40 NOT NULL,
	`terms` text DEFAULT 'Prices are in New Zealand dollars and include GST. This quotation remains valid until the date shown above.' NOT NULL,
	`warranty` text DEFAULT '' NOT NULL,
	`installation_exclusions` text DEFAULT '' NOT NULL,
	`email_signature` text DEFAULT 'Kind regards
QuoteFlow Wardrobes' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `archived` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quote_items` ADD `quantity` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `quote_items` ADD `unit_price` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quote_items` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `archived` integer DEFAULT false NOT NULL;