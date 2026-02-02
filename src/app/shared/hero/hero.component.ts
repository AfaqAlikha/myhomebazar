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

  defaultSlides = [
    {
      images: ['/slider1.jpeg'],
      name: 'Default Slide 1',
      catName: '',
      description: '',
      price: 0,
    },
    {
      images: ['/slider2.jpeg'],
      name: 'Default Slide 2',
      catName: '',
      description: '',
      price: 0,
    },
    {
      images: ['/slider3.jpeg'],
      name: 'Default Slide 3',
      catName: '',
      description: '',
      price: 0,
    },
  ];

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

  get slidesToShowList() {
    return this.featured && this.featured.length ? this.featured : this.defaultSlides;
  }

  isDefault(slide: any) {
    return !slide.price && !slide.name; // fallback images
  }
}
