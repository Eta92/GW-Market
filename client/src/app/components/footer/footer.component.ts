import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  constructor(private router: Router) {}

  goTo(url: string): void {
    this.router.navigate([url]);
  }

  joinDiscord(): void {
    window.open('https://discord.gg/a4pPyJ3paN', '_blank');
  }

  joinDaybreak(): void {
    window.open('https://github.com/gwdevhub/Daybreak', '_blank');
  }

  joinGwToolbox(): void {
    window.open('https://www.gwtoolbox.com/', '_blank');
  }
}
