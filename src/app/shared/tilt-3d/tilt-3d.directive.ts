import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appTilt3d]',
  standalone: true,
})
export class Tilt3dDirective implements OnDestroy {
  @Input() tiltMax = 8;

  private readonly isBrowser: boolean;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.el.nativeElement.classList.add('tilt-3d');
    }
  }

  @HostListener('mouseenter')
  onEnter(): void {
    if (!this.isBrowser) return;
    this.el.nativeElement.style.transition = 'transform 0.08s ease-out';
  }

  @HostListener('mousemove', ['$event'])
  onMove(event: MouseEvent): void {
    if (!this.isBrowser) return;

    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) * 2 - 1) * this.tiltMax;
    const rotateX = ((y / rect.height) * -2 + 1) * this.tiltMax;

    node.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.02)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (!this.isBrowser) return;

    const node = this.el.nativeElement;
    node.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    node.style.transform = '';

    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      node.style.transition = '';
      this.resetTimer = null;
    }, 460);
  }

  ngOnDestroy(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }
}
