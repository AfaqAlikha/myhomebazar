import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
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

  readonly emojiList = ['😀', '😂', '😍', '👍', '🙏', '🔥', '✅', '❤️', '😊', '🎉', '💯', '🛒'];

  private messagesPage = 1;
  private readonly messagesPageSize = 30;
  private loadedConversationId: string | null = null;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private stopTypingTimeout?: ReturnType<typeof setTimeout>;
  private isTyping = false;

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

    const user = this.auth.getUser();
    if (user?.id) this.socket.connect(user.id);

    this.subs.push(
      this.chat.conversations$.subscribe((items) => {
        this.conversations = items;
        this.loadingConversations = false;
        this.syncActiveConversation();
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
    );
  }

  ngOnDestroy(): void {
    this.emitStopTyping();
    this.chat.setActiveConversation(null);
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  get productContext(): ChatProductContext | null {
    return this.activeConversation?.productContext || null;
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

  private clearActiveConversation(): void {
    this.emitStopTyping();
    this.activeConversation = null;
    this.chat.setActiveConversation(null);
    this.loadedConversationId = null;
    this.messages = [];
    this.messagesPage = 1;
    this.hasMoreMessages = false;
    this.typingLabel = '';
    this.cdr.markForCheck();
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
      const el = document.getElementById('chat-thread-bottom');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}
