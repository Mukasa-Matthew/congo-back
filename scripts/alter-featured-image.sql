-- Alter featured_image column to support longer URLs
ALTER TABLE articles MODIFY COLUMN featured_image VARCHAR(1000);

