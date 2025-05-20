import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications: string[] = [];
  private notificationSubject = new Subject<string[]>();

  getNotificationListener() {
    return this.notificationSubject.asObservable();
  }

  addNotification(message: string) {
    this.notifications.unshift(message);  
    this.notificationSubject.next([...this.notifications]);
  }

  clearNotifications() {
    this.notifications = [];
    this.notificationSubject.next([]);
  }
}
