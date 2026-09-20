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
  lastSeenAt?: string | Date | null;
}

export interface ChatProductContext {
  productId: string;
  name: string;
  image: string;
  price: number;
}

export interface ChatConversation {
  _id: string;
  peer: ChatPeer;
  lastMessage?: string;
  lastMessageAt?: string | Date | null;
  unreadCount?: number;
  productContext?: ChatProductContext | null;
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
  private activeConversationId: string | null = null;

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

  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId ? String(conversationId) : null;
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

  startWithSeller(sellerId: string, productId?: string): Observable<ChatConversation> {
    return this.http
      .post<{ success: boolean; conversation: ChatConversation }>(API_ENDPOINTS.chat.conversations, {
        sellerId,
        ...(productId ? { productId } : {}),
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
          messages: (res.messages || []).map((message) => this.normalizeMessage(message)),
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
      .pipe(
        map((res) => {
          if (!res?.message?._id) {
            throw new Error('Invalid chat message response');
          }
          return this.normalizeMessage(res.message);
        }),
      );
  }

  markRead(conversationId: string): Observable<void> {
    const id = String(conversationId);
    return this.http.patch<void>(API_ENDPOINTS.chat.read(id), {}).pipe(
      tap(() => {
        const updated = this.conversationsSubject.value.map((item) =>
          String(item._id) === id ? { ...item, unreadCount: 0 } : item,
        );
        this.conversationsSubject.next(updated);
      }),
    );
  }

  private normalizeMessage(message: ChatMessage): ChatMessage {
    return {
      ...message,
      _id: String(message._id),
      conversationId: String(message.conversationId),
      senderId: String(message.senderId),
      createdAt: message.createdAt || new Date().toISOString(),
    };
  }

  private upsertConversation(conversation: ChatConversation): void {
    const id = String(conversation._id);
    const current = [...this.conversationsSubject.value];
    const index = current.findIndex((item) => String(item._id) === id);

    if (index >= 0) {
      const existing = current[index];
      current[index] = {
        ...existing,
        ...conversation,
        _id: id,
        peer: {
          ...(existing.peer || { _id: '', name: 'Chat' }),
          ...(conversation.peer || {}),
          name: conversation.peer?.name || existing.peer?.name || 'Chat',
        },
      };
    } else {
      current.unshift({
        ...conversation,
        _id: id,
        peer: conversation.peer || { _id: '', name: 'Chat' },
      });
    }

    current.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
    );
    this.conversationsSubject.next(current);
  }

  private applyIncomingSocketMessage(payload: ChatSocketPayload): void {
    if (!payload.conversation) return;

    const conversation = payload.conversation as ChatConversation;
    const conversationId = String(conversation._id);
    const isActive =
      !!this.activeConversationId && conversationId === String(this.activeConversationId);

    if (isActive) {
      this.upsertConversation({ ...conversation, _id: conversationId, unreadCount: 0 });
      return;
    }

    this.upsertConversation({ ...conversation, _id: conversationId });
  }

  private handleBuyerNotification(notification: any): void {
    if (notification?.type !== 'chat_message_received') return;

    const conversationId = notification?.data?.conversationId
      ? String(notification.data.conversationId)
      : null;

    const onActiveChat =
      !!conversationId
      && !!this.activeConversationId
      && String(this.activeConversationId) === conversationId;

    const onMessagesPage =
      this.router.url.startsWith('/messages')
      && (!conversationId || this.router.url.includes(conversationId));

    if (onActiveChat || onMessagesPage) {
      if (conversationId) this.markRead(conversationId).subscribe();
      return;
    }

    this.refreshConversations().subscribe();

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
