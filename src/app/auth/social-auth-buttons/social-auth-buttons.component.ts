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
import { SocialAuthService } from '../social-auth.service';

@Component({
  selector: 'app-social-auth-buttons',
  standalone: true,
  imports: [NgIf],
  templateUrl: './social-auth-buttons.component.html',
  styleUrl: './social-auth-buttons.component.css',
})
export class SocialAuthButtonsComponent implements AfterViewInit {
  @Input() dividerLabel = 'or continue with Google';
  @Output() googleToken = new EventEmitter<string>();
  @Output() facebookToken = new EventEmitter<string>();

  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef<HTMLElement>;

  constructor(public social: SocialAuthService) {}

  ngAfterViewInit(): void {
    if (!this.social.googleEnabled || !this.googleBtnHost?.nativeElement) return;
    const host = this.googleBtnHost.nativeElement;
    requestAnimationFrame(() => {
      this.social.renderGoogleButton(host, (token) => this.googleToken.emit(token));
    });
  }

  // Facebook — re-enable in template when Meta app is live
  /*
  facebookLoading = false;
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
