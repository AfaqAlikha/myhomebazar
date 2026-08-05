import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth-interceptor';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

describe('AuthInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => false,
            getToken: () => null,
            isLoggingOut: () => false,
            wasSessionActive: () => false,
            clearStaleSession: () => {},
            handleSessionExpired: () => {},
            refreshAccessToken: () => ({ pipe: () => ({}) }),
          },
        },
        {
          provide: ToastrService,
          useValue: { error: () => {}, success: () => {} },
        },
      ],
    });
  });

  it('should be created', () => {
    const interceptor = TestBed.inject(AuthInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
