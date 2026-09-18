import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type Promo3dVariant = 'flash' | 'delivery';

@Component({
  selector: 'app-promo-3d-card',
  standalone: true,
  imports: [NgFor, MatIconModule],
  templateUrl: './promo-3d-card.component.html',
  styleUrl: './promo-3d-card.component.css',
})
export class Promo3dCardComponent {
  @Input({ required: true }) variant!: Promo3dVariant;

  tiltX = 0;
  tiltY = 0;

  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get floatIcons(): { icon: string; delay: string }[] {
    if (this.variant === 'delivery') {
      return [
        { icon: 'local_shipping', delay: '0s' },
        { icon: 'inventory_2', delay: '0.7s' },
        { icon: 'redeem', delay: '1.4s' },
      ];
    }
    return [
      { icon: 'bolt', delay: '0s' },
      { icon: 'local_offer', delay: '0.7s' },
      { icon: 'timer', delay: '1.4s' },
    ];
  }

  get heroIcon(): string {
    return this.variant === 'delivery' ? 'local_shipping' : 'flash_on';
  }

  cardTransform(): string {
    return `rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg) translateZ(0)`;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    this.tiltY = px * 12;
    this.tiltX = -py * 10;
  }

  onMouseLeave(): void {
    this.tiltX = 0;
    this.tiltY = 0;
  }
}
