import { Component, Input, OnInit } from '@angular/core';
import { NgFor, NgIf, NgStyle } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService, Category } from '../../services/category.service';
@Component({
  selector: 'app-category-links',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, NgStyle,NgIf],
  templateUrl: './category-links.component.html',
  styleUrls: ['./category-links.component.css'],
})
export class CategoryLinksComponent implements OnInit {
  categories: Category[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => (this.categories = res),
      error: (err) => console.error(err),
    });
  }
}
