import { Component } from '@angular/core';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';

import { trigger, style, animate, transition } from '@angular/animations';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  standalone: true,
  imports: [UiCardComponent, NgFor],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '800ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '800ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
    ]),
    trigger('fadeRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '800ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
    ]),
  ],
})
export class AboutComponent {
  borderRadius = '8px';

  deliveryStats = [
    {
      icon: 'store',
      title: '10.5k',
      description: 'Sellers active on our site',
    },
    { icon: 'attach_money', title: '33k', description: 'Monthly Product Sale' },
    {
      icon: 'shopping_basket',
      title: '45.5k',
      description: 'Customers active on our site',
    },
    { icon: 'money', title: '25k', description: 'Annual gross sale' },
  ];

  owners = [
    {
      img: '/image 46.png',
      name: 'Tom Cruise',
      role: 'Founder & Chairman',
      animation: 'fadeRight',
    },
    {
      img: '/image 51.png',
      name: 'Emma Watson',
      role: 'Managing Director',
      animation: 'fadeIn',
    },
    {
      img: '/image 47.png',
      name: 'Will Smith',
      role: 'Product Designer',
      animation: 'fadeLeft',
    },
  ];

  deliveryFeatures = [
    {
      icon: 'local_shipping',
      title: 'FREE AND FAST DELIVERY',
      desc: 'Free delivery for all orders over $140',
    },
    {
      icon: 'headset_mic',
      title: '24/7 CUSTOMER SERVICE',
      desc: 'Friendly 24/7 customer support',
    },
    {
      icon: 'verified',
      title: 'MONEY BACK GUARANTEE',
      desc: 'We return money within 30 days',
    },
  ];
}
