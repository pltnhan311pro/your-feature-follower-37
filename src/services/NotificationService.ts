// Notification Service - manages notifications
import { Notification } from '@/types';
import { StorageService } from './StorageService';

const NOTIFICATIONS_KEY = 'notifications';

export class NotificationService {
  static getAll(): Notification[] {
    return StorageService.getAll<Notification>(NOTIFICATIONS_KEY);
  }

  static getByUserId(userId: string): Notification[] {
    const notifications = StorageService.findByField<Notification>(NOTIFICATIONS_KEY, 'userId', userId);
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getUnreadCount(userId: string): number {
    const notifications = this.getByUserId(userId);
    return notifications.filter(n => !n.isRead).length;
  }

  static create(data: {
    userId: string;
    title: string;
    message: string;
    type: Notification['type'];
    relatedId?: string;
  }): Notification {
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedId: data.relatedId,
    };
    StorageService.addItem(NOTIFICATIONS_KEY, notification);
    return notification;
  }

  static markAsRead(id: string): Notification | null {
    return StorageService.updateItem<Notification>(NOTIFICATIONS_KEY, id, { isRead: true });
  }

  static markAllAsRead(userId: string): void {
    const notifications = StorageService.getAll<Notification>(NOTIFICATIONS_KEY);
    const updated = notifications.map(n => 
      n.userId === userId ? { ...n, isRead: true } : n
    );
    StorageService.set(NOTIFICATIONS_KEY, updated);
  }

  static delete(id: string): boolean {
    return StorageService.deleteItem<Notification>(NOTIFICATIONS_KEY, id);
  }
}
