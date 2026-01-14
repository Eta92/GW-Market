import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Contingency } from '@app/models/contingency.model';
import { Drug } from '@app/models/drug.model';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Khi2Test, Khi2Trust } from '@app/models/analyse.model';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';

@Component({
  selector: 'app-caracteristics-ctg',
  templateUrl: './caracteristics-ctg.component.html',
  styleUrls: ['./caracteristics-ctg.component.scss']
})
export class CaracteristicsContingencyComponent implements OnInit {
  public patientData: Array<Patient>;
  public drugData: { [key: string]: Drug };
  public pathologyContingencies: Array<Contingency>;
  public filteredContingencies: Array<Contingency>;
  public form: FormGroup;

  public mainCategories = ['Neuro', 'psychiatrique', 'traumatologie', 'cancerologie', 'Démence'];

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
      this.processCaracteristics();
    });
    this.storeService.getDrugATCData().subscribe((data: { [key: string]: Drug }) => {
      this.drugData = data;
      this.processCaracteristics();
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

  processCaracteristics(): void {
    if (this.patientData && this.drugData) {
      this.pathologyContingencies = this.processService.processCaracteristicContingency(
        this.patientData,
        this.drugData
      );
      // .map(patho => {
      //   return {
      //     ...patho,
      //     categories: patho.categories.filter(category => this.mainCategories.includes(category.name))
      //   };
      // });
      this.filterAnalysis();
    }
  }

  filterAnalysis(): void {
    if (this.pathologyContingencies.length && this.form.value.search !== '') {
      this.filteredContingencies = this.pathologyContingencies.filter(patho =>
        patho.name.toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredContingencies = this.pathologyContingencies;
    }
    this.cdr.detectChanges();
  }

  fixed(nb: number, digits = 2): string {
    return nb.toFixed(digits);
  }

  toPercent(nb: number): string {
    return (nb * 100).toFixed(1) + '%';
  }

  pOpacity(p: number): string {
    return (Math.pow(1 - p, 3) + 0.2).toString();
  }

  translateTestsToString(tests: Array<Khi2Test>): string {
    let correlation = '';
    tests.forEach(test => {
      if (test.valid) {
        switch (test.trust) {
          case Khi2Trust.Correlation900:
            correlation = 'Corrélation 90%';
            break;
          case Khi2Trust.Correlation950:
            correlation = 'Corrélation 95%';
            break;
          case Khi2Trust.Correlation975:
            correlation = 'Corrélation 97.5%';
            break;
          case Khi2Trust.Correlation990:
            correlation = 'Corrélation 99%';
            break;
          case Khi2Trust.Correlation999:
            correlation = 'Corrélation 99.9%';
            break;
        }
      }
    });
    return correlation;
  }

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
