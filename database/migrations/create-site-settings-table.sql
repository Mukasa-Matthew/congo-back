-- Create site_settings table for managing website branding and configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('text', 'textarea', 'url', 'email', 'number') DEFAULT 'text',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'Congo News', 'text', 'Website name/title'),
('site_tagline', 'Breaking News & Latest Updates', 'text', 'Website tagline/motto'),
('site_description', 'Your trusted source for breaking news and latest updates', 'textarea', 'Website meta description'),
('site_logo_url', '', 'url', 'URL to the site logo image'),
('site_favicon_url', '', 'url', 'URL to the site favicon'),
('contact_email', 'contact@congonews.com', 'email', 'Contact email address'),
('contact_phone', '', 'text', 'Contact phone number'),
('facebook_url', '', 'url', 'Facebook page URL'),
('twitter_url', '', 'url', 'Twitter/X profile URL'),
('instagram_url', '', 'url', 'Instagram profile URL'),
('youtube_url', '', 'url', 'YouTube channel URL'),
('footer_copyright', 'Congo News', 'text', 'Footer copyright text')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

