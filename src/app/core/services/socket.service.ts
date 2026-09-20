import { Injectable, Inject, PLATFORM_ID, OnDestroy, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { env } from '../../../environments/env';
import { getSocketClientOptions, normalizeSocketUrl } from '../utils/socket-url';

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

export interface ChatMessagePayload {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt?: string | Date | null;
  createdAt: string | Date;
}

export interface ChatProductContext {
  productId: string;
  name: string;
  image: string;
  price: number;
}

export interface ChatSocketPayload {
  conversationId: string;
  message: ChatMessagePayload;
  conversation?: {
    _id: string;
    peer: { _id: string; name: string; avatar?: string; role?: string };
    lastMessage?: string;
    lastMessageAt?: string | Date | null;
    unreadCount?: number;
    productContext?: ChatProductContext | null;
  };
}

export interface ChatTypingPayload {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface ChatPresencePayload {
  userId: string;
  conversationId?: string;
  status: 'online' | 'offline';
  lastSeenAt?: string | Date | null;
}

export interface ChatMessagesReadPayload {
  conversationId: string;
  readAt: string | Date;
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
  readonly chatNotification$ = new Subject<any>();
  readonly chatMessage$ = new Subject<ChatSocketPayload>();
  readonly chatTyping$ = new Subject<ChatTypingPayload>();
  readonly chatStopTyping$ = new Subject<ChatTypingPayload>();
  readonly chatPresence$ = new Subject<ChatPresencePayload>();
  readonly chatMessagesRead$ = new Subject<ChatMessagesReadPayload>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private readonly ngZone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private emitInZone<T>(subject: Subject<T>, payload: T): void {
    this.ngZone.run(() => subject.next(payload));
  }

  connect(userId: string): void {
    if (!this.isBrowser || !userId) return;

    if (this.socket && this.connectedUserId === userId) return;

    this.disconnect();

    this.socket = io(normalizeSocketUrl(env.WEBSOCET_URL), getSocketClientOptions());

    this.connectedUserId = userId;

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', String(userId));
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    this.socket.on('orderStatusUpdate', (payload: OrderStatusUpdatePayload) => {
      this.emitInZone(this.orderStatusUpdate$, payload);
    });

    this.socket.on('buyerNotification', (payload: any) => {
      this.emitInZone(this.buyerNotification$, payload);
    });

    this.socket.on('chatNotification', (payload: any) => {
      this.emitInZone(this.chatNotification$, payload);
    });

    this.socket.on('chatMessage', (payload: ChatSocketPayload) => {
      this.emitInZone(this.chatMessage$, payload);
    });

    this.socket.on('chatTyping', (payload: ChatTypingPayload) => {
      this.emitInZone(this.chatTyping$, payload);
    });

    this.socket.on('chatStopTyping', (payload: ChatTypingPayload) => {
      this.emitInZone(this.chatStopTyping$, payload);
    });

    this.socket.on('chatPresence', (payload: ChatPresencePayload) => {
      this.emitInZone(this.chatPresence$, payload);
    });

    this.socket.on('chatMessagesRead', (payload: ChatMessagesReadPayload) => {
      this.emitInZone(this.chatMessagesRead$, payload);
    });
  }

  emitChatPresenceActive(conversationId: string, recipientId: string, userId: string): void {
    this.socket?.emit('chatPresenceActive', {
      conversationId: String(conversationId),
      recipientId: String(recipientId),
      userId: String(userId),
    });
  }

  emitChatPresenceInactive(recipientId: string, userId: string): void {
    this.socket?.emit('chatPresenceInactive', {
      recipientId: String(recipientId),
      userId: String(userId),
    });
  }

  emitChatTyping(
    conversationId: string,
    recipientId: string,
    userId: string,
    userName: string,
  ): void {
    this.socket?.emit('chatTyping', {
      conversationId: String(conversationId),
      recipientId: String(recipientId),
      userId: String(userId),
      userName,
    });
  }

  emitChatStopTyping(conversationId: string, recipientId: string, userId: string): void {
    this.socket?.emit('chatStopTyping', {
      conversationId: String(conversationId),
      recipientId: String(recipientId),
      userId: String(userId),
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
