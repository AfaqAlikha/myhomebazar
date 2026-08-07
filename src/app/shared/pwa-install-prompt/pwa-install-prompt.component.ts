import { Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [NgIf],
  template: `
    <div
      *ngIf="pwa.showInstallPrompt()"
      class="pwa-install"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-modal="false"
    >
      <div class="pwa-install__card">
        <button
          type="button"
          class="pwa-install__close"
          aria-label="Close"
          (click)="dismiss()"
        >
          ×
        </button>

        <div class="pwa-install__row">
          <img
            src="/icons/icon-96.png"
            width="56"
            height="56"
            alt=""
            class="pwa-install__icon"
          />
          <div class="pwa-install__copy">
            <h2 id="pwa-install-title">Install MyHomeBazar App</h2>
            <p>
              Add to your home screen for a faster, full-screen shopping experience — no Play Store
              needed.
            </p>
          </div>
        </div>

        <div *ngIf="showIosHelp()" class="pwa-install__ios">
          <p>On iPhone / iPad:</p>
          <ol>
            <li>Tap the <strong>Share</strong> button in Safari</li>
            <li>Choose <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong></li>
          </ol>
        </div>

        <div class="pwa-install__actions">
          <button type="button" class="pwa-install__secondary" (click)="dismiss()">
            Not now
          </button>
          <button
            *ngIf="!showIosHelp()"
            type="button"
            class="pwa-install__primary"
            (click)="install()"
          >
            Install App
          </button>
          <button
            *ngIf="showIosHelp()"
            type="button"
            class="pwa-install__primary"
            (click)="gotIt()"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pwa-install {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 99990;
        padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
        pointer-events: none;
      }

      .pwa-install__card {
        pointer-events: auto;
        position: relative;
        max-width: 440px;
        margin: 0 auto;
        padding: 1rem 1rem 0.9rem;
        border-radius: 16px;
        background: #111;
        color: #f5f5f5;
        border: 1px solid rgba(255, 152, 0, 0.35);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        animation: pwa-slide-up 0.35s ease;
      }

      @keyframes pwa-slide-up {
        from {
          transform: translateY(24px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .pwa-install__close {
        position: absolute;
        top: 8px;
        right: 10px;
        border: 0;
        background: transparent;
        color: #aaa;
        font-size: 1.4rem;
        line-height: 1;
        cursor: pointer;
      }

      .pwa-install__row {
        display: flex;
        gap: 0.85rem;
        align-items: flex-start;
        padding-right: 1.25rem;
      }

      .pwa-install__icon {
        flex-shrink: 0;
        border-radius: 12px;
        background: #000;
      }

      .pwa-install__copy h2 {
        margin: 0 0 0.35rem;
        font-size: 1.05rem;
        font-weight: 700;
      }

      .pwa-install__copy p {
        margin: 0;
        font-size: 0.88rem;
        line-height: 1.45;
        color: #cfcfcf;
      }

      .pwa-install__ios {
        margin-top: 0.75rem;
        padding: 0.65rem 0.75rem;
        border-radius: 10px;
        background: rgba(76, 175, 80, 0.12);
        font-size: 0.85rem;
      }

      .pwa-install__ios p {
        margin: 0 0 0.35rem;
        font-weight: 600;
      }

      .pwa-install__ios ol {
        margin: 0;
        padding-left: 1.1rem;
      }

      .pwa-install__ios li {
        margin: 0.2rem 0;
      }

      .pwa-install__actions {
        display: flex;
        gap: 0.6rem;
        justify-content: flex-end;
        margin-top: 0.9rem;
      }

      .pwa-install__primary,
      .pwa-install__secondary {
        border: 0;
        border-radius: 999px;
        padding: 0.55rem 1.1rem;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }

      .pwa-install__primary {
        color: #000;
        background: linear-gradient(90deg, #4caf50, #ff9800);
      }

      .pwa-install__secondary {
        color: #ddd;
        background: transparent;
        border: 1px solid #444;
      }

      @media (min-width: 768px) {
        .pwa-install {
          bottom: 1.25rem;
        }
      }
    `,
  ],
})
export class PwaInstallPromptComponent {
  showIosHelp = signal(false);

  constructor(
    public pwa: PwaService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    if (isPlatformBrowser(platformId) && pwa.isIos() && !pwa.canInstall()) {
      this.showIosHelp.set(true);
    }
  }

  async install(): Promise<void> {
    const result = await this.pwa.promptInstall();
    if (result === 'ios') {
      this.showIosHelp.set(true);
    }
  }

  gotIt(): void {
    this.pwa.dismissForAWhile();
  }

  dismiss(): void {
    this.pwa.dismissForAWhile();
  }
}
