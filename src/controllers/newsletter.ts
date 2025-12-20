import { Request, Response } from 'express';
import { dbPromise } from '../config/database';

export async function subscribeNewsletter(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const db = await dbPromise;

    // Check if email already exists
    const [existing] = await db.execute(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return res.status(200).json({ 
        message: 'Email already subscribed',
        subscribed: true 
      });
    }

    // Insert new subscriber
    await db.execute(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())',
      [email]
    );

    return res.status(201).json({ 
      message: 'Successfully subscribed to newsletter',
      subscribed: true 
    });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
}

export async function getNewsletterSubscribers(req: Request, res: Response) {
  try {
    const db = await dbPromise;
    const [subscribers] = await db.execute(
      'SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC'
    );

    return res.json(subscribers);
  } catch (error: any) {
    console.error('Get subscribers error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
}

export async function unsubscribeNewsletter(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = await dbPromise;
    await db.execute(
      'DELETE FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    return res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
}

