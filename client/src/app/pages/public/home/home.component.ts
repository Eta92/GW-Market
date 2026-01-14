import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '@app/services/store.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private storeService: StoreService
  ) {}

  ngOnInit(): void {
    this.storeService.secureRequestSocket('GetAllData');
  }

  goTo(url: string): void {
    this.router.navigate(['public', url]);
  }
}
