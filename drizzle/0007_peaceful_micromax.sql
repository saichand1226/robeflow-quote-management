ALTER TABLE `quotes` ADD `invoice_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `invoice_status` text DEFAULT 'To invoice' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `invoice_sent_at` text;