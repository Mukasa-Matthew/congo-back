-- Create article_media table for storing multiple images/videos per article
CREATE TABLE IF NOT EXISTS article_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  media_url VARCHAR(1000) NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article (article_id),
  INDEX idx_order (display_order)
);

-- Migrate existing featured_image to article_media
INSERT INTO article_media (article_id, media_url, media_type, display_order)
SELECT id, featured_image, 
  CASE 
    WHEN featured_image LIKE '%.mp4%' OR featured_image LIKE '%.webm%' OR featured_image LIKE '%.mov%' 
    OR featured_image LIKE '%.avi%' OR featured_image LIKE '%video%' THEN 'video'
    ELSE 'image'
  END,
  0
FROM articles 
WHERE featured_image IS NOT NULL AND featured_image != '';

