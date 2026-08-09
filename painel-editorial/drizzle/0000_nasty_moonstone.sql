CREATE TABLE `user_settings` (
	`user_email` text PRIMARY KEY NOT NULL,
	`anthropic_key_ciphertext` text,
	`anthropic_key_iv` text,
	`anthropic_key_last_four` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
