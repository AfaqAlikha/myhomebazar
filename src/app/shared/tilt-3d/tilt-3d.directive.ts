import { Directive, ElementRef, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appTilt3d]',
  standalone: true,
})
export class Tilt3dDirective {
  private readonly isBrowser: boolean;
  private readonly prefersReducedMotion: boolean;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.prefersReducedMotion =
      this.isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  @HostListener('mousemove', ['$event'])
  onMove(event: MouseEvent): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    this.el.nativeElement.style.transform = '';
  }
}
