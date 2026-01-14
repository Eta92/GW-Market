import { NgModule } from '@angular/core';
import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '@shared/shared.module';
import { AntecedentsComponent } from './antecedants/antecedents.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { PosologiesComponent } from './posologies/posologies.component';
import { PrevalencesComponent } from './prevalences/prevalences.component';
import { ConditionsATCComponent } from './conditions-atc/conditions-atc.component';
import { AntecedentsContingencyComponent } from './antecedants-ctg/antecedants-ctg.component';
import { RemediesComponent } from './remedies/remedies.component';
import { CaracteristicsContingencyComponent } from './caracteristics-ctg/caracteristics-ctg.component';
import { PathologiesComponent } from './pathologies/pathologies.component';

@NgModule({
  declarations: [
    PublicComponent,
    HomeComponent,
    AntecedentsComponent,
    AntecedentsContingencyComponent,
    CaracteristicsContingencyComponent,
    ConditionsComponent,
    ConditionsATCComponent,
    PathologiesComponent,
    PosologiesComponent,
    PrevalencesComponent,
    RemediesComponent
  ],
  imports: [SharedModule, PublicRoutingModule]
})
export class PublicModule {}
