import { Request, Response } from 'express';
import { dbPromise } from '../config/database';

// Get all site settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const [settings] = await dbPromise.execute(
      'SELECT setting_key, setting_value, setting_type, description FROM site_settings ORDER BY setting_key'
    );

    // Convert array to object for easier access
    const settingsObject: Record<string, any> = {};
    (settings as any[]).forEach((setting: any) => {
      settingsObject[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
      };
    });

    return res.json(settingsObject);
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get public settings (for public frontend)
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const [settings] = await dbPromise.execute(
      `SELECT setting_key, setting_value 
       FROM site_settings 
       WHERE setting_key IN ('site_name', 'site_tagline', 'site_description', 'site_logo_url', 'site_favicon_url', 'contact_email', 'contact_phone', 'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'footer_copyright')
       ORDER BY setting_key`
    );

    // Convert array to object
    const settingsObject: Record<string, string> = {};
    (settings as any[]).forEach((setting: any) => {
      settingsObject[setting.setting_key] = setting.setting_value || '';
    });

    return res.json(settingsObject);
  } catch (error) {
    console.error('Get public settings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update site settings
export const updateSettings = async (req: any, res: Response) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      await dbPromise.execute(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        [key, value, value]
      );
    });

    await Promise.all(updates);

    return res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

