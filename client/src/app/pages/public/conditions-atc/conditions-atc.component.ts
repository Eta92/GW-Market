import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Drug } from '@app/models/drug.model';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Analyse, Khi2Test, Khi2Trust } from '@app/models/analyse.model';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';

@Component({
  selector: 'app-conditions-atc',
  templateUrl: './conditions-atc.component.html',
  styleUrls: ['./conditions-atc.component.scss']
})
export class ConditionsATCComponent implements OnInit {
  public patientData: Array<Patient>;
  public drugData: { [key: string]: Drug };
  public conditionAnalysis: Array<Analyse>;
  public filteredAnalysis: Array<Analyse>;
  public form: FormGroup;

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
      this.processConditions();
    });
    this.storeService.getDrugATCData().subscribe((data: { [key: string]: Drug }) => {
      this.drugData = data;
      this.processConditions();
    });
    this.form = this.formBuilder.group({
      search: ['']
    });
    this.form
      .get('search')
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        this.filterAnalysis();
      });
    this.storeService.secureRequestSocket('GetAllData');
  }

  processConditions(): void {
    if (this.patientData && this.drugData) {
      this.conditionAnalysis = this.processService.processConditionsATC(this.patientData, this.drugData);
      this.filterAnalysis();
    }
  }

  filterAnalysis(): void {
    if (this.conditionAnalysis.length && this.form.value.search !== '') {
      this.filteredAnalysis = this.conditionAnalysis.filter(patho =>
        patho.name.toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredAnalysis = this.conditionAnalysis;
    }
    this.cdr.detectChanges();
  }

  fixed(nb: number): string {
    return nb.toFixed(2);
  }

  // translateTestToString(test: Khi2Test): string {
  //   switch (test) {
  //     case Khi2Test.Correlation90:
  //       return 'Corrélation 90%';
  //     case Khi2Test.Correlation95:
  //       return 'Corrélation 95%';
  //     case Khi2Test.Correlation97:
  //       return 'Corrélation 97.5%';
  //     case Khi2Test.Correlation99:
  //       return 'Corrélation 99%';
  //     default:
  //       return 'aucune';
  //   }
  // }

  translateTestToStyle(tests: Array<Khi2Test>): string {
    const trust = tests.reduce((prev, curr) => (curr.valid ? curr.trust : prev), null);
    switch (trust) {
      case Khi2Trust.Correlation950:
        return 'text-yellow-600 opacity-60';
      case Khi2Trust.Correlation990:
        return 'text-lime-600 opacity-80';
      case Khi2Trust.Correlation999:
        return 'text-green-600 opacity-100';
      default:
        return 'opacity-40 text-red-600';
    }
  }

  goBack(): void {
    this.router.navigate(['public', 'home']);
  }
}
