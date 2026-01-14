import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Prevalence } from '@app/models/posology.model';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';
import { DrugType } from '@app/models/drug.enum';
import { Drug } from '@app/models/drug.model';

@Component({
  selector: 'app-prevalences',
  templateUrl: './prevalences.component.html',
  styleUrls: ['./prevalences.component.scss']
})
export class PrevalencesComponent implements OnInit {
  public patientData: Array<Patient>;
  public prevalences: Array<Prevalence>;
  public filteredPrevalences: Array<Prevalence>;
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
      this.processPrevalences();
    });
    this.storeService.getDrugATCData().subscribe((data: { [key: string]: Drug }) => {
      this.drugData = data;
      this.processPrevalences();
    });
    this.form = this.formBuilder.group({
      search: ['']
    });
    this.form
      .get('search')
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        this.filterPrevalences();
      });
    this.storeService.secureRequestSocket('GetAllData');
  }

  processPrevalences(): void {
    if (this.patientData && this.drugData) {
      this.prevalences = this.processService.processPrevalences(this.patientData, this.drugData);
      this.filterPrevalences();
    }
  }

  filterPrevalences(): void {
    if (this.prevalences.length && this.form.value.search !== '') {
      this.filteredPrevalences = this.prevalences.filter(patho =>
        DrugType[patho.type].toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredPrevalences = this.prevalences;
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
