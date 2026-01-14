import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Criteria } from '@app/models/criteria.model';
import { Drug } from '@app/models/drug.model';
import { RemediesService } from '@app/services/remedies.service';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { PathologyType } from '@app/models/pathology.enum';
import { Patient } from '@app/models/patient.model';
import { StoreService } from '@app/services/store.service';

@Component({
  selector: 'app-remedies',
  templateUrl: './remedies.component.html',
  styleUrls: ['./remedies.component.scss']
})
export class RemediesComponent implements OnInit {
  public patientData: Array<Patient>;
  public drugData: { [key: string]: Drug };
  public pathologyData: { [key: string]: PathologyType };
  public pathologyRemedies: Array<Criteria>;
  public filteredRemedies: Array<Criteria>;
  public form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private socket: Socket,
    private storeService: StoreService,
    private remediesService: RemediesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.getPatientData().subscribe((data: Array<Patient>) => {
      this.patientData = data;
      this.processCriteria();
    });
    this.storeService.getDrugATCData().subscribe((data: { [key: string]: Drug }) => {
      this.drugData = data;
      this.processCriteria();
    });
    this.storeService.getPathologyData().subscribe((data: { [key: string]: PathologyType }) => {
      this.pathologyData = data;
      this.processCriteria();
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

  processCriteria(): void {
    if (this.patientData && this.drugData && this.pathologyData) {
      this.pathologyRemedies = this.remediesService.processRemediesCriterias(
        this.patientData,
        this.drugData,
        this.pathologyData
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
    if (this.pathologyRemedies.length && this.form.value.search !== '') {
      this.filteredRemedies = this.pathologyRemedies.filter(patho =>
        patho.name.toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredRemedies = this.pathologyRemedies;
    }
    this.cdr.detectChanges();
  }

  fixed(nb: number): string {
    return nb.toFixed(2);
  }

  toPercent(nb: number): string {
    return (nb * 100).toFixed(1) + '%';
  }

  getDrugCode(prescription: string): string {
    if (this.drugData) {
      return this.drugData[prescription.toUpperCase().trim()].atc;
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['public', 'home']);
  }
}
