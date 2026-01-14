import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Shop } from '@app/models/shop.model';
import { StoreService } from '@app/services/store.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-active-player',
  templateUrl: './active-player.component.html',
  styleUrls: ['./active-player.component.scss']
})
export class ActivePlayerComponent implements OnInit, OnChanges {
  @Input() shop: Shop;

  @Output() closeEdit = new EventEmitter<void>();
  @Output() confirmPlayer = new EventEmitter<string>();

  public form: UntypedFormGroup;
  public secret: string;
  private whisperBase = '/w Gwmarket Auth, ';

  constructor(
    private fb: UntypedFormBuilder,
    private storeService: StoreService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.shop ? this.shop.player : '']
    });
    this.storeService.getShopSecret().subscribe((certificate: { uuid: string; secret: string }) => {
      if (certificate) {
        this.secret = this.whisperBase + certificate.uuid + '|' + certificate.secret;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shop'] && this.shop && this.form) {
      this.form.patchValue({ name: this.shop.player });
      this.secret = '';
    }
  }

  copySecret(): void {
    if (this.secret) {
      navigator.clipboard.writeText(this.secret).then(() => {
        this.toastrService.success('Certification message copied to clipboard', '', {
          timeOut: 3000
        });
      });
    }
  }

  addPlayer(): void {
    this.storeService.requestSocket('askPlayerCertification', this.shop.uuid);
  }

  onConfirmPlayer(): void {
    const playerName = this.form.get('name')?.value;
    this.confirmPlayer.emit(playerName);
  }
}
