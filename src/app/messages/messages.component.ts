import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  ChatConversation,
  ChatMessage,
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
    DatePipe,
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

  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  activeConversation: ChatConversation | null = null;
  loadingConversations = true;
  loadingMessages = false;
  loadingOlder = false;
  hasMoreMessages = false;
  sending = false;

  private messagesPage = 1;
  private readonly messagesPageSize = 30;

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
      }),
      this.chat.refreshConversations().subscribe(),
      this.route.paramMap.subscribe((params) => {
        const conversationId = params.get('conversationId');
        if (conversationId) {
          this.openConversation(conversationId);
        } else {
          this.activeConversation = null;
          this.messages = [];
          this.messagesPage = 1;
          this.hasMoreMessages = false;
        }
      }),
      this.socket.chatMessage$.subscribe((payload) => {
        if (!this.activeConversation || payload.conversationId !== this.activeConversation._id) {
          return;
        }

        const viewerId = String(this.auth.getUser()?.id || '');
        if (String(payload.message.senderId) === viewerId) {
          return;
        }

        this.appendMessage(payload.message);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  openConversation(conversationId: string): void {
    const found = this.conversations.find((item) => item._id === conversationId);
    if (found) {
      this.activeConversation = found;
    } else if (!this.activeConversation || this.activeConversation._id !== conversationId) {
      this.activeConversation = {
        _id: conversationId,
        peer: { _id: '', name: 'Chat' },
      };
    }

    this.messagesPage = 1;
    this.hasMoreMessages = false;
    this.loadMessages(conversationId, 1, true);
  }

  selectConversation(conversation: ChatConversation): void {
    this.router.navigate(['/messages', conversation._id]);
  }

  sendMessage(): void {
    if (!this.activeConversation || this.messageForm.invalid || this.sending) return;

    const text = String(this.messageForm.value.text || '').trim();
    if (!text) return;

    this.sending = true;
    this.chat.sendMessage(this.activeConversation._id, text).subscribe({
      next: (message) => {
        this.appendMessage(message);
        this.messageForm.reset();
        this.sending = false;
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
      },
    });
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

  private loadMessages(conversationId: string, page: number, replace: boolean): void {
    if (replace) {
      this.loadingMessages = true;
    } else {
      this.loadingOlder = true;
    }

    this.chat.getMessagesPage(conversationId, page, this.messagesPageSize).subscribe({
      next: ({ messages, pagination }) => {
        const scrollEl = this.threadBody?.nativeElement;
        const previousHeight = scrollEl?.scrollHeight || 0;

        if (replace) {
          this.messages = messages;
        } else {
          this.messages = this.mergeMessages(messages, this.messages);
        }

        this.messagesPage = pagination.currentPage;
        this.hasMoreMessages = pagination.currentPage < pagination.totalPages;
        this.loadingMessages = false;
        this.loadingOlder = false;

        if (replace) {
          this.chat.markRead(conversationId).subscribe();
          this.scrollToBottom();
        } else if (scrollEl) {
          setTimeout(() => {
            scrollEl.scrollTop = scrollEl.scrollHeight - previousHeight;
          }, 0);
        }
      },
      error: () => {
        this.loadingMessages = false;
        this.loadingOlder = false;
      },
    });
  }

  private appendMessage(message: ChatMessage): void {
    this.messages = this.mergeMessages(this.messages, [message]);
  }

  private mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const map = new Map<string, ChatMessage>();
    for (const item of [...existing, ...incoming]) {
      map.set(String(item._id), item);
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
