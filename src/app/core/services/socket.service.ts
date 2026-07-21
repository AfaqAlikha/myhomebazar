import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { env } from '../../../environments/env';

export interface OrderStatusUpdatePayload {
  orderId: string;
  status: string;
  shipmentStatus?: string;
  deliveredAt?: string;
  canReview?: boolean;
  canClaim?: boolean;
  trackingNumber?: string;
  courierPartner?: string;
  productName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private isBrowser: boolean;

  readonly orderStatusUpdate$ = new Subject<OrderStatusUpdatePayload>();
  readonly buyerNotification$ = new Subject<any>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  connect(userId: string): void {
    if (!this.isBrowser || !userId) return;

    if (this.socket && this.connectedUserId === userId) return;

    this.disconnect();

    this.socket = io(env.WEBSOCET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      path: '/socket.io/',
    });

    this.connectedUserId = userId;

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', String(userId));
    });

    this.socket.on('orderStatusUpdate', (payload: OrderStatusUpdatePayload) => {
      this.orderStatusUpdate$.next(payload);
    });

    this.socket.on('buyerNotification', (payload: any) => {
      this.buyerNotification$.next(payload);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectedUserId = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
