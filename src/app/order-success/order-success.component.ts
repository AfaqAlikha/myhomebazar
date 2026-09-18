import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [NgIf, RouterLink, UiCardComponent, UiButtonComponent],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css'],
})
export class OrderSuccessComponent implements OnInit {
  orderId = '';
  isGuest = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId') || '';
    this.isGuest = this.route.snapshot.queryParamMap.get('guest') === '1';
  }

  trackOrder(): void {
    this.router.navigate(['/track-order'], {
      queryParams: this.orderId ? { orderId: this.orderId } : {},
    });
  }
}
