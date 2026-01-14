import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Posology } from '@app/models/posology.model';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';
import { DrugType } from '@app/models/drug.enum';
import { Drug } from '@app/models/drug.model';

@Component({
  selector: 'app-posologies',
  templateUrl: './posologies.component.html',
  styleUrls: ['./posologies.component.scss']
})
export class PosologiesComponent implements OnInit {
  public patientData: Array<Patient>;
  public posologies: Array<Posology>;
  public filteredPosologies: Array<Posology>;
  public drugData: { [key: string]: Drug };
  public form: FormGroup;

  public DrugType = DrugType;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private socket: Socket,
    private storeService: StoreService,
    private processService: ProcessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.getPatientData().subscribe((data: Array<Patient>) => {
      this.patientData = data;
      this.processPosologies();
    });
    this.storeService.getDrugATCData().subscribe((data: { [key: string]: Drug }) => {
      this.drugData = data;
      this.processPosologies();
    });
    this.form = this.formBuilder.group({
      search: ['']
    });
    this.form
      .get('search')
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        this.filterPosologies();
      });
    this.storeService.secureRequestSocket('GetAllData');
  }

  processPosologies(): void {
    if (this.patientData && this.drugData) {
      this.posologies = this.processService.processPosologies(this.patientData, this.drugData);
      this.filterPosologies();
    }
  }

  filterPosologies(): void {
    if (this.posologies.length && this.form.value.search !== '') {
      this.filteredPosologies = this.posologies.filter(patho =>
        DrugType[patho.type].toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredPosologies = this.posologies;
    }
    this.cdr.detectChanges();
  }

  fixed(nb: number): string {
    return nb.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['public', 'home']);
  }
}
