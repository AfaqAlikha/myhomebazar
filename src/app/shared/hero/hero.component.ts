import { Component, Input } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [NgFor, SlickCarouselModule, RouterModule, NgIf, NgClass],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HomeHeroComponent {
  @Input() featured: any[] = [];

  slideConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    pauseOnHover: true,
    adaptiveHeight: true,
  };

  getDiscount(slide: any) {
    if (slide.promotion?.isActive) return slide.promotion.discountPercent;
    return Math.round(((slide.price - slide.discountPrice) / slide.price) * 100);
  }
}
