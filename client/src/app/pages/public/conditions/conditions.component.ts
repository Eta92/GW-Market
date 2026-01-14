import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Analyse, Khi2Test, Khi2Trust } from '@app/models/analyse.model';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';

@Component({
  selector: 'app-conditions',
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.scss']
})
export class ConditionsComponent implements OnInit {
  public patientData: Array<Patient>;
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
      this.conditionAnalysis = this.processService.processConditions(data);
      this.filterAnalysis();
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
