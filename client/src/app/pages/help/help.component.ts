import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['']);
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }
}
