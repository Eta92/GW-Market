import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['']);
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }
}
