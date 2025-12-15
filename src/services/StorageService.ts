// Generic localStorage service - abstraction layer for data persistence
// This can be replaced with a real backend (e.g., Supabase) later

const STORAGE_PREFIX = 'hr_portal_';

export class StorageService {
  private static getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  }

  static getAll<T>(key: string): T[] {
    return this.get<T[]>(key) || [];
  }

  static addItem<T extends { id: string }>(key: string, item: T): void {
    const items = this.getAll<T>(key);
    items.push(item);
    this.set(key, items);
  }

  static updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
    const items = this.getAll<T>(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.set(key, items);
    return items[index];
  }

  static deleteItem<T extends { id: string }>(key: string, id: string): boolean {
    const items = this.getAll<T>(key);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    
    this.set(key, filtered);
    return true;
  }

  static findById<T extends { id: string }>(key: string, id: string): T | null {
    const items = this.getAll<T>(key);
    return items.find(item => item.id === id) || null;
  }

  static findByField<T>(key: string, field: keyof T, value: unknown): T[] {
    const items = this.getAll<T>(key);
    return items.filter(item => item[field] === value);
  }
}
