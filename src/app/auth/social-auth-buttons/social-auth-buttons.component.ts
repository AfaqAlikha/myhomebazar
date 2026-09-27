import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { SocialAuthService } from '../social-auth.service';

@Component({
  selector: 'app-social-auth-buttons',
  standalone: true,
  imports: [NgIf, UiButtonComponent],
  template: `
    <div class="flex flex-col gap-3 w-full">
      @if (social.googleEnabled) {
        <div #googleBtnHost class="w-full flex justify-center"></div>
      }
      <!-- Facebook login UI disabled until Meta app is live — uncomment block below to restore
      @if (social.facebookEnabled) {
        <app-ui-button
          label="Continue with Facebook"
          type="button"
          variant="primary"
          [loading]="facebookLoading"
          (clicked)="onFacebook()"
        ></app-ui-button>
      }
      -->
      @if (social.googleEnabled) {
        <div class="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span class="flex-1 h-px bg-[var(--color-border)]"></span>
          <span>or</span>
          <span class="flex-1 h-px bg-[var(--color-border)]"></span>
        </div>
      }
      <app-ui-button
        [label]="manualLabel"
        type="button"
        variant="accent"
        (clicked)="manualClick.emit()"
      ></app-ui-button>
    </div>
  `,
})
export class SocialAuthButtonsComponent implements AfterViewInit {
  @Input() manualLabel = 'Continue with Email';
  @Output() googleToken = new EventEmitter<string>();
  @Output() facebookToken = new EventEmitter<string>();
  @Output() manualClick = new EventEmitter<void>();

  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef<HTMLElement>;

  facebookLoading = false;

  constructor(public social: SocialAuthService) {}

  ngAfterViewInit(): void {
    if (this.social.googleEnabled && this.googleBtnHost?.nativeElement) {
      this.social.renderGoogleButton(this.googleBtnHost.nativeElement, (token) => {
        this.googleToken.emit(token);
      });
    }
  }

  // Facebook login — re-enable when Meta app is live (used by commented template block above)
  /*
  onFacebook(): void {
    this.facebookLoading = true;
    this.social
      .loginWithFacebook()
      .then((token) => this.facebookToken.emit(token))
      .catch(() => {})
      .finally(() => {
        this.facebookLoading = false;
      });
  }
  */
}
