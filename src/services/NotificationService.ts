// Notification Service - manages notifications (Supabase version)
// Maps to localStorage key: hr_portal_notifications
import { Notification } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper to convert DB row to Notification
const mapDbToNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type as Notification['type'],
  isRead: row.is_read,
  createdAt: row.created_at,
  relatedId: row.related_id,
});

export class NotificationService {
  static async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return (data || []).map(mapDbToNotification);
  }

  static async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToNotification);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) return 0;
    return count || 0;
  }

  static async create(data: {
    userId: string;
    title: string;
    message: string;
    type: Notification['type'];
    relatedId?: string;
  }): Promise<Notification | null> {
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: false,
        related_id: data.relatedId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    return mapDbToNotification(inserted);
  }

  static async markAsRead(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapDbToNotification(data);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}
