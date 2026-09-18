import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  sending = false;

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
        }
      }),
      this.socket.chatMessage$.subscribe((payload) => {
        if (!this.activeConversation || payload.conversationId !== this.activeConversation._id) {
          return;
        }
        const exists = this.messages.some((item) => item._id === payload.message._id);
        if (!exists) {
          this.messages = [...this.messages, payload.message];
        }
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

    this.loadingMessages = true;
    this.chat.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        this.chat.markRead(conversationId).subscribe();
        this.scrollToBottom();
      },
      error: () => {
        this.loadingMessages = false;
      },
    });
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
        this.messages = [...this.messages, message];
        this.messageForm.reset();
        this.sending = false;
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
      },
    });
  }

  isMine(message: ChatMessage): boolean {
    return String(message.senderId) === String(this.auth.getUser()?.id);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('chat-thread-bottom');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}
