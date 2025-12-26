-- Add username field to users table
ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE AFTER email;

-- Set default username from email for existing users (extract part before @)
UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL;

