import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, map, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { ChatSocketPayload, SocketService } from '../core/services/socket.service';

export interface ChatPeer {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface ChatConversation {
  _id: string;
  peer: ChatPeer;
  lastMessage?: string;
  lastMessageAt?: string | Date | null;
  unreadCount?: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt?: string | Date | null;
  createdAt: string | Date;
}

export interface ChatPagination {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  pagination: ChatPagination;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  readonly conversations$ = this.conversationsSubject.asObservable();

  private socketSub?: Subscription;
  private authSub?: Subscription;
  private buyerNotifSub?: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly socket: SocketService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
  ) {
    this.authSub = this.auth.user$.subscribe((user) => {
      if (user?.id) {
        this.socket.connect(user.id);
        this.refreshConversations().subscribe();
      } else {
        this.conversationsSubject.next([]);
      }
    });

    this.socketSub = this.socket.chatMessage$.subscribe((payload) => {
      this.applyIncomingSocketMessage(payload);
    });

    this.buyerNotifSub = this.socket.buyerNotification$.subscribe((notification) => {
      this.handleBuyerNotification(notification);
    });
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.buyerNotifSub?.unsubscribe();
  }

  get unreadTotal(): number {
    return this.conversationsSubject.value.reduce(
      (sum, item) => sum + (item.unreadCount || 0),
      0,
    );
  }

  refreshConversations(): Observable<ChatConversation[]> {
    if (!this.auth.isLoggedIn()) {
      this.conversationsSubject.next([]);
      return this.conversations$;
    }

    return this.http
      .get<{ success: boolean; conversations: ChatConversation[] }>(API_ENDPOINTS.chat.conversations)
      .pipe(
        map((res) => res.conversations || []),
        tap((conversations) => this.conversationsSubject.next(conversations)),
      );
  }

  startWithSeller(sellerId: string): Observable<ChatConversation> {
    return this.http
      .post<{ success: boolean; conversation: ChatConversation }>(API_ENDPOINTS.chat.conversations, {
        sellerId,
      })
      .pipe(
        map((res) => res.conversation),
        tap((conversation) => this.upsertConversation(conversation)),
      );
  }

  getMessages(conversationId: string, page = 1, limit = 30): Observable<ChatMessage[]> {
    return this.getMessagesPage(conversationId, page, limit).pipe(map((res) => res.messages));
  }

  getMessagesPage(
    conversationId: string,
    page = 1,
    limit = 30,
  ): Observable<ChatMessagesPage> {
    return this.http
      .get<{
        success: boolean;
        messages: ChatMessage[];
        pagination: ChatPagination;
      }>(API_ENDPOINTS.chat.messages(conversationId), {
        params: { page: String(page), limit: String(limit) },
      })
      .pipe(
        map((res) => ({
          messages: res.messages || [],
          pagination: res.pagination || {
            totalItems: 0,
            currentPage: page,
            pageSize: limit,
            totalPages: 1,
          },
        })),
      );
  }

  sendMessage(conversationId: string, text: string): Observable<ChatMessage> {
    return this.http
      .post<{ success: boolean; message: ChatMessage }>(
        API_ENDPOINTS.chat.messages(conversationId),
        { text },
      )
      .pipe(map((res) => res.message));
  }

  markRead(conversationId: string): Observable<void> {
    return this.http.patch<void>(API_ENDPOINTS.chat.read(conversationId), {}).pipe(
      tap(() => {
        const updated = this.conversationsSubject.value.map((item) =>
          item._id === conversationId ? { ...item, unreadCount: 0 } : item,
        );
        this.conversationsSubject.next(updated);
      }),
    );
  }

  private upsertConversation(conversation: ChatConversation): void {
    const current = [...this.conversationsSubject.value];
    const index = current.findIndex((item) => item._id === conversation._id);
    if (index >= 0) {
      current[index] = { ...current[index], ...conversation };
    } else {
      current.unshift(conversation);
    }
    current.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
    );
    this.conversationsSubject.next(current);
  }

  private applyIncomingSocketMessage(payload: ChatSocketPayload): void {
    if (payload.conversation) {
      this.upsertConversation(payload.conversation as ChatConversation);
    }
  }

  private handleBuyerNotification(notification: any): void {
    if (notification?.type !== 'chat_message_received') return;

    this.refreshConversations().subscribe();

    const conversationId = notification?.data?.conversationId;
    const onMessagesPage =
      this.router.url.startsWith('/messages') &&
      (!conversationId || this.router.url.includes(String(conversationId)));

    if (onMessagesPage) return;

    this.toastr.info(notification.message || 'New message received', 'Messages', {
      timeOut: 5000,
      closeButton: true,
    });

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(notification.title || 'New message', {
        body: notification.message,
      });
    }
  }
}
