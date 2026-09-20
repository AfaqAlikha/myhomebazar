import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe, NgClass, NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  ChatConversation,
  ChatMessage,
  ChatProductContext,
  ChatService,
} from '../services/chat.service';
import { UserAvatarComponent } from '../shared/user-avatar/user-avatar.component';
import { SocketService } from '../core/services/socket.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    NgClass,
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    DecimalPipe,
    UserAvatarComponent,
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('threadBody') threadBody?: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly chat = inject(ChatService);
  private readonly socket = inject(SocketService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  activeConversation: ChatConversation | null = null;
  loadingConversations = true;
  loadingMessages = false;
  loadingOlder = false;
  hasMoreMessages = false;
  sending = false;
  showEmojiPicker = false;
  typingLabel = '';
  peerOnline = false;
  peerLastSeen: string | Date | null = null;
  peerPresenceByUserId: Record<string, { online: boolean; lastSeenAt?: string | Date | null }> = {};

  readonly emojiList = ['😀', '😂', '😍', '👍', '🙏', '🔥', '✅', '❤️', '😊', '🎉', '💯', '🛒'];

  private messagesPage = 1;
  private readonly messagesPageSize = 30;
  private loadedConversationId: string | null = null;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private stopTypingTimeout?: ReturnType<typeof setTimeout>;
  private isTyping = false;
  private activePresencePeers = new Set<string>();

  messageForm = this.fb.group({
    text: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  private subs: Subscription[] = [];

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: this.router.url || '/messages' },
      });
      return;
    }

    this.setChatRouteLayout(true);

    const user = this.auth.getUser();
    if (user?.id) this.socket.connect(user.id);

    this.subs.push(
      this.chat.conversations$.subscribe((items) => {
        this.conversations = items;
        this.loadingConversations = false;
        this.syncActiveConversation();
        this.syncChatPresence();
        this.cdr.markForCheck();
      }),
      this.chat.refreshConversations().subscribe(),
      this.route.paramMap.subscribe((params) => {
        const conversationId = params.get('conversationId');
        if (conversationId) {
          this.openConversation(conversationId);
        } else {
          this.clearActiveConversation();
        }
      }),
      this.socket.chatMessage$.subscribe((payload) => this.handleIncomingMessage(payload)),
      this.socket.chatTyping$.subscribe((payload) => this.handleTyping(payload)),
      this.socket.chatStopTyping$.subscribe((payload) => this.handleStopTyping(payload)),
      this.socket.chatPresence$.subscribe((payload) => this.handlePresence(payload)),
      this.socket.chatMessagesRead$.subscribe((payload) => this.handleMessagesRead(payload)),
    );
  }

  ngOnDestroy(): void {
    this.setChatRouteLayout(false);
    this.deactivateAllChatPresence();
    this.emitStopTyping();
    this.chat.setActiveConversation(null);
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  get peerStatusLabel(): string {
    if (this.typingLabel) return this.typingLabel;
    if (this.peerOnline) return 'online';
    return this.formatLastSeen(this.peerLastSeen ?? this.activeConversation?.peer?.lastSeenAt);
  }

  get productContext(): ChatProductContext | null {
    return this.activeConversation?.productContext || null;
  }

  isPeerOnline(peerId?: string | null): boolean {
    if (!peerId) return false;
    return this.peerPresenceByUserId[String(peerId)]?.online === true;
  }

  openConversation(conversationId: string): void {
    const id = String(conversationId);
    this.syncActiveConversation(id);

    if (!this.activeConversation || String(this.activeConversation._id) !== id) {
      this.activeConversation = {
        _id: id,
        peer: { _id: '', name: 'Chat' },
      };
    }

    this.chat.setActiveConversation(id);
    this.typingLabel = '';
    const peerId = this.activeConversation.peer?._id;
    const peerPresence = peerId ? this.peerPresenceByUserId[String(peerId)] : undefined;
    this.peerOnline = peerPresence?.online === true;
    this.peerLastSeen =
      peerPresence?.lastSeenAt ?? this.activeConversation.peer?.lastSeenAt ?? null;
    this.updateChatThreadLayout();
    this.syncChatPresence();

    if (this.loadedConversationId === id && this.messages.length > 0) {
      this.cdr.markForCheck();
      return;
    }

    this.messagesPage = 1;
    this.hasMoreMessages = false;
    this.loadMessages(id, 1, true);
  }

  selectConversation(conversation: ChatConversation): void {
    this.router.navigate(['/messages', conversation._id]);
  }

  sendMessage(): void {
    if (!this.activeConversation || this.messageForm.invalid || this.sending) return;

    const text = String(this.messageForm.value.text || '').trim();
    if (!text) return;

    this.emitStopTyping();
    this.sending = true;
    this.chat.sendMessage(this.activeConversation._id, text).subscribe({
      next: (message) => {
        this.appendMessage(message);
        this.messageForm.reset();
        this.sending = false;
        this.showEmojiPicker = false;
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
        this.cdr.markForCheck();
      },
    });
  }

  onComposerInput(): void {
    if (!this.activeConversation) return;

    const peerId = this.activeConversation.peer?._id;
    const viewer = this.auth.getUser();
    if (!peerId || !viewer?.id) return;

    if (!this.isTyping) {
      this.isTyping = true;
      this.socket.emitChatTyping(
        this.activeConversation._id,
        peerId,
        viewer.id,
        viewer.name || 'User',
      );
    }

    if (this.stopTypingTimeout) clearTimeout(this.stopTypingTimeout);
    this.stopTypingTimeout = setTimeout(() => this.emitStopTyping(), 1800);
  }

  onComposerBlur(): void {
    this.emitStopTyping();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    const current = String(this.messageForm.value.text || '');
    this.messageForm.patchValue({ text: `${current}${emoji}` });
    this.onComposerInput();
  }

  onThreadScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el || this.loadingOlder || this.loadingMessages || !this.hasMoreMessages) return;
    if (el.scrollTop > 100 || !this.activeConversation) return;

    this.loadMessages(this.activeConversation._id, this.messagesPage + 1, false);
  }

  isMine(message: ChatMessage): boolean {
    return String(message.senderId) === String(this.auth.getUser()?.id);
  }

  messageTime(message: ChatMessage): string {
    const value = message?.createdAt ? new Date(message.createdAt) : null;
    if (!value || Number.isNaN(value.getTime())) return '';
    return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  conversationTime(conversation: ChatConversation): string {
    if (!conversation.lastMessageAt) return '';
    const value = new Date(conversation.lastMessageAt);
    if (Number.isNaN(value.getTime())) return '';
    return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  peerName(conversation: ChatConversation | null): string {
    return conversation?.peer?.name?.trim() || 'Chat';
  }

  isMessageRead(message: ChatMessage): boolean {
    return this.isMine(message) && !!message.readAt;
  }

  formatLastSeen(value: string | Date | null | undefined): string {
    if (!value) return 'offline';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'offline';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) return `last seen today at ${time}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `last seen yesterday at ${time}`;
    }

    return `last seen ${date.toLocaleDateString()} ${time}`;
  }

  private handleIncomingMessage(payload: {
    conversationId: string;
    message: ChatMessage;
  }): void {
    if (!this.activeConversation) return;

    const activeId = String(this.activeConversation._id);
    if (String(payload.conversationId) !== activeId) return;

    const message = this.normalizeMessage(payload.message);
    if (!message) return;

    this.typingLabel = '';
    this.appendMessage(message);

    const viewerId = String(this.auth.getUser()?.id || '');
    if (String(message.senderId) !== viewerId) {
      this.chat.markRead(activeId).subscribe();
    }
  }

  private handleTyping(payload: {
    conversationId: string;
    userId: string;
    userName?: string;
  }): void {
    if (!this.activeConversation) return;
    if (String(payload.conversationId) !== String(this.activeConversation._id)) return;
    if (String(payload.userId) === String(this.auth.getUser()?.id || '')) return;

    this.typingLabel = `${payload.userName || 'User'} is typing…`;

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.typingLabel = '';
      this.cdr.markForCheck();
    }, 2800);

    this.cdr.markForCheck();
  }

  private handleStopTyping(payload: {
    conversationId: string;
    userId: string;
  }): void {
    if (!this.activeConversation) return;
    if (String(payload.conversationId) !== String(this.activeConversation._id)) return;
    if (String(payload.userId) === String(this.auth.getUser()?.id || '')) return;

    this.typingLabel = '';
    this.cdr.markForCheck();
  }

  private emitStopTyping(): void {
    if (!this.isTyping || !this.activeConversation) return;

    const peerId = this.activeConversation.peer?._id;
    const viewer = this.auth.getUser();
    if (peerId && viewer?.id) {
      this.socket.emitChatStopTyping(this.activeConversation._id, peerId, viewer.id);
    }

    this.isTyping = false;
    if (this.stopTypingTimeout) clearTimeout(this.stopTypingTimeout);
  }

  private handlePresence(payload: {
    userId: string;
    status: 'online' | 'offline';
    lastSeenAt?: string | Date | null;
  }): void {
    const userId = String(payload.userId);
    const online = payload.status === 'online';
    const previous = this.peerPresenceByUserId[userId];

    this.peerPresenceByUserId[userId] = {
      online,
      lastSeenAt: payload.lastSeenAt ?? previous?.lastSeenAt ?? null,
    };

    if (this.activeConversation?.peer?._id && String(this.activeConversation.peer._id) === userId) {
      this.peerOnline = online;
      this.peerLastSeen = online
        ? previous?.lastSeenAt ?? this.activeConversation.peer?.lastSeenAt ?? null
        : payload.lastSeenAt ?? previous?.lastSeenAt ?? this.activeConversation.peer?.lastSeenAt ?? null;
    }

    this.cdr.markForCheck();
  }

  private handleMessagesRead(payload: {
    conversationId: string;
    readAt: string | Date;
  }): void {
    if (!this.activeConversation) return;
    if (String(payload.conversationId) !== String(this.activeConversation._id)) return;

    const readAt = payload.readAt;
    const viewerId = String(this.auth.getUser()?.id || '');
    this.messages = this.messages.map((message) =>
      String(message.senderId) === viewerId && !message.readAt
        ? { ...message, readAt }
        : message,
    );
    this.cdr.markForCheck();
  }

  private syncChatPresence(): void {
    const viewer = this.auth.getUser();
    if (!viewer?.id) return;

    const desiredPeers = new Map<string, string>();
    if (this.activeConversation?.peer?._id) {
      desiredPeers.set(String(this.activeConversation.peer._id), String(this.activeConversation._id));
    } else {
      this.conversations.forEach((conversation) => {
        if (conversation.peer?._id) {
          desiredPeers.set(String(conversation.peer._id), String(conversation._id));
        }
      });
    }

    for (const peerId of this.activePresencePeers) {
      if (!desiredPeers.has(peerId)) {
        this.socket.emitChatPresenceInactive(peerId, viewer.id);
      }
    }

    for (const [peerId, conversationId] of desiredPeers.entries()) {
      if (!this.activePresencePeers.has(peerId)) {
        this.socket.emitChatPresenceActive(conversationId, peerId, viewer.id);
      }
    }

    this.activePresencePeers = new Set(desiredPeers.keys());
  }

  private deactivateAllChatPresence(): void {
    const viewer = this.auth.getUser();
    if (!viewer?.id) return;

    for (const peerId of this.activePresencePeers) {
      this.socket.emitChatPresenceInactive(peerId, viewer.id);
    }
    this.activePresencePeers.clear();
    this.peerOnline = false;
  }

  private clearActiveConversation(): void {
    this.emitStopTyping();
    this.activeConversation = null;
    this.chat.setActiveConversation(null);
    this.loadedConversationId = null;
    this.messages = [];
    this.messagesPage = 1;
    this.hasMoreMessages = false;
    this.typingLabel = '';
    this.peerOnline = false;
    this.syncChatPresence();
    this.updateChatThreadLayout();
    this.cdr.markForCheck();
  }

  private setChatRouteLayout(active: boolean): void {
    if (!this.isBrowser) return;

    document.documentElement.classList.toggle('chat-route-active', active);
    document.body.classList.toggle('chat-route-active', active);
    if (!active) {
      document.documentElement.classList.remove('chat-thread-active');
      document.body.classList.remove('chat-thread-active');
    } else {
      this.updateChatThreadLayout();
    }
  }

  private updateChatThreadLayout(): void {
    if (!this.isBrowser) return;

    const inThread = !!this.activeConversation;
    document.documentElement.classList.toggle('chat-thread-active', inThread);
    document.body.classList.toggle('chat-thread-active', inThread);
  }

  private loadMessages(conversationId: string, page: number, replace: boolean): void {
    const id = String(conversationId);

    if (replace) {
      this.loadingMessages = true;
    } else {
      this.loadingOlder = true;
    }
    this.cdr.markForCheck();

    this.chat.getMessagesPage(id, page, this.messagesPageSize).subscribe({
      next: ({ messages, pagination }) => {
        const scrollEl = this.threadBody?.nativeElement;
        const previousHeight = scrollEl?.scrollHeight || 0;

        if (replace) {
          this.messages = messages;
          this.loadedConversationId = id;
        } else {
          this.messages = this.mergeMessages(messages, this.messages);
        }

        this.messagesPage = pagination.currentPage;
        this.hasMoreMessages = pagination.currentPage < pagination.totalPages;
        this.loadingMessages = false;
        this.loadingOlder = false;

        if (replace) {
          this.chat.markRead(id).subscribe();
          this.scrollToBottom();
        } else if (scrollEl) {
          setTimeout(() => {
            scrollEl.scrollTop = scrollEl.scrollHeight - previousHeight;
          }, 0);
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingMessages = false;
        this.loadingOlder = false;
        this.cdr.markForCheck();
      },
    });
  }

  private syncActiveConversation(conversationId?: string): void {
    const id = conversationId ? String(conversationId) : this.activeConversation?._id;
    if (!id) return;

    const found = this.conversations.find((item) => String(item._id) === String(id));
    if (found) {
      this.activeConversation = found;
    }
  }

  private appendMessage(message: ChatMessage): void {
    const normalized = this.normalizeMessage(message);
    if (!normalized) return;

    this.messages = this.mergeMessages(this.messages, [normalized]);
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  private normalizeMessage(message: ChatMessage | null | undefined): ChatMessage | null {
    if (!message?._id) return null;

    return {
      ...message,
      _id: String(message._id),
      conversationId: String(message.conversationId || this.activeConversation?._id || ''),
      senderId: String(message.senderId),
      text: String(message.text || ''),
      createdAt: message.createdAt || new Date().toISOString(),
      readAt: message.readAt ?? null,
    };
  }

  private mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const map = new Map<string, ChatMessage>();

    for (const item of [...existing, ...incoming]) {
      const normalized = this.normalizeMessage(item);
      if (!normalized) continue;
      map.set(normalized._id, normalized);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.threadBody?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
