ALTER TABLE `customers` ADD `company_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `site_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `company_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `customer_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `site_address` text DEFAULT '' NOT NULL;