import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgClass, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.css'],
  imports: [NgIf, NgClass, NgSwitch, NgSwitchCase, RouterLink],
})
export class EmailVerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private toastr = inject(ToastrService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  message = signal('Verifying your email...');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.auth.verifyEmail(token).subscribe({
        next: (res: any) => {
          this.status.set('success');
          this.message.set(res.message || 'Email verified successfully!');
          this.toastr.success(this.message());
        },
        error: (err: any) => {
          this.status.set('error');
          this.message.set(err?.error?.message || 'Email verification failed.');
          this.toastr.error(this.message());
        },
      });
    } else {
      this.status.set('error');
      this.message.set('No verification token found.');
      this.toastr.error(this.message());
    }
  }
}
