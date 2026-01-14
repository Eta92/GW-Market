import { Component, OnInit } from '@angular/core';
import { UtilService } from '@app/services/util.service';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss']
})
export class PublicComponent implements OnInit {
  constructor(private utilService: UtilService) {}
  ngOnInit(): void {
    this.utilService.start();
  }
}
