import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { debounceTime } from 'rxjs';
import { Patient } from '@app/models/patient.model';
import { ProcessService } from '@app/services/process.service';
import { StoreService } from '@app/services/store.service';
import { DrugType } from '@app/models/drug.enum';
import { Pathology } from '@app/models/pathology.model';
import { PathologyType } from '@app/models/pathology.enum';

@Component({
  selector: 'app-pathologies',
  templateUrl: './pathologies.component.html',
  styleUrls: ['./pathologies.component.scss']
})
export class PathologiesComponent implements OnInit {
  public patientData: Array<Patient>;
  public pathologies: Array<Pathology>;
  public filteredPathologies: Array<Pathology>;
  public pathoData: { [key: string]: PathologyType };
  public form: FormGroup;

  public PathologyType = PathologyType;

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
      this.processPathologies();
    });
    this.storeService.getPathologyData().subscribe((data: { [key: string]: PathologyType }) => {
      this.pathoData = data;
      this.processPathologies();
    });
    this.form = this.formBuilder.group({
      search: ['']
    });
    this.form
      .get('search')
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        this.filterPathologies();
      });
    this.storeService.secureRequestSocket('GetAllData');
  }

  processPathologies(): void {
    if (this.patientData && this.pathoData) {
      this.pathologies = this.processService.processPathologyOccurence(this.patientData, this.pathoData);
      this.filterPathologies();
    }
  }

  filterPathologies(): void {
    if (this.pathologies.length && this.form.value.search !== '') {
      this.filteredPathologies = this.pathologies.filter(patho =>
        DrugType[patho.type].toLowerCase().includes(this.form.value.search.toLowerCase())
      );
    } else {
      this.filteredPathologies = this.pathologies;
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
