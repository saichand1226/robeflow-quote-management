CREATE TABLE `pick_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer NOT NULL,
	`area_name` text DEFAULT '' NOT NULL,
	`product_name` text NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `quotes` ADD `pick_list_status` text DEFAULT 'Not generated' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `picked_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `picked_at` text;