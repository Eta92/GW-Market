import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  @ViewChild('categoryNav') categoryNav!: ElementRef;

  selectedCategory: string = '';

  constructor(private router: Router) {}

  selectCategory(category: string): void {
    this.selectedCategory = category;
    setTimeout(() => {
      this.categoryNav?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  goHome(): void {
    this.router.navigate(['']);
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }
}
