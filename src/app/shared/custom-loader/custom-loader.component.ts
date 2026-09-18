import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { SpinnerService } from '../spinner.service';

@Component({
  selector: 'app-custom-loader',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  template: `
    <div class="custom-loader-overlay" *ngIf="spinner.visible$ | async" aria-live="polite" aria-busy="true">
      <div class="custom-loader-spinner" aria-hidden="true"></div>
    </div>
  `,
  styles: [
    `
      .custom-loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(1px);
        -webkit-backdrop-filter: blur(1px);
      }

      .custom-loader-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
        border-top-color: var(--color-accent);
        border-radius: 50%;
        animation: custom-loader-rotate 0.75s linear infinite;
      }

      @keyframes custom-loader-rotate {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class CustomLoaderComponent {
  constructor(public spinner: SpinnerService) {}
}
