import { Component, Input, OnChanges } from '@angular/core';
import { NgIf } from '@angular/common';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="user-avatar" [class]="sizeClass" [attr.aria-label]="name || 'User'">
      <img
        *ngIf="showImage"
        [src]="avatar"
        [alt]="name || 'User avatar'"
        class="user-avatar__img"
        (error)="onImageError()"
      />
      <span *ngIf="!showImage" class="user-avatar__initial">{{ initial }}</span>
    </div>
  `,
  styles: [
    `
      .user-avatar {
        flex-shrink: 0;
        border-radius: 9999px;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-accent);
        color: #fff;
        font-weight: 700;
        line-height: 1;
      }

      .user-avatar--xs {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        font-size: 0.875rem;
      }

      .user-avatar--sm {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
        font-size: 1.125rem;
      }

      .user-avatar--md {
        width: 64px;
        height: 64px;
        min-width: 64px;
        min-height: 64px;
        font-size: 1.375rem;
      }

      .user-avatar--lg {
        width: 80px;
        height: 80px;
        min-width: 80px;
        min-height: 80px;
        font-size: 1.75rem;
      }

      .user-avatar__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .user-avatar__initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-transform: uppercase;
      }
    `,
  ],
})
export class UserAvatarComponent implements OnChanges {
  @Input() name = '';
  @Input() avatar: string | null | undefined = '';
  @Input() size: AvatarSize = 'md';

  showImage = false;

  ngOnChanges(): void {
    this.showImage = !!this.avatar?.trim();
  }

  get sizeClass(): string {
    return `user-avatar--${this.size}`;
  }

  get initial(): string {
    const letter = this.name?.trim()?.charAt(0);
    return letter ? letter.toUpperCase() : '?';
  }

  onImageError(): void {
    this.showImage = false;
  }
}
