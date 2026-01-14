import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PublicComponent } from './public.component';
import { AntecedentsComponent } from './antecedants/antecedents.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { PosologiesComponent } from './posologies/posologies.component';
import { PrevalencesComponent } from './prevalences/prevalences.component';
import { ConditionsATCComponent } from './conditions-atc/conditions-atc.component';
import { AntecedentsContingencyComponent } from './antecedants-ctg/antecedants-ctg.component';
import { RemediesComponent } from './remedies/remedies.component';
import { CaracteristicsContingencyComponent } from './caracteristics-ctg/caracteristics-ctg.component';
import { PathologiesComponent } from './pathologies/pathologies.component';

const routes: Routes = [
  {
    path: '',
    component: PublicComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'public/home' },
      {
        path: 'public/home',
        component: HomeComponent
      },
      {
        path: 'public/antecedents',
        component: AntecedentsComponent
      },
      {
        path: 'public/antecedents-ctg',
        component: AntecedentsContingencyComponent
      },
      {
        path: 'public/caracteristic-ctg',
        component: CaracteristicsContingencyComponent
      },
      {
        path: 'public/conditions',
        component: ConditionsComponent
      },
      {
        path: 'public/conditions-atc',
        component: ConditionsATCComponent
      },
      {
        path: 'public/pathologies',
        component: PathologiesComponent
      },
      {
        path: 'public/posologies',
        component: PosologiesComponent
      },
      {
        path: 'public/prevalences',
        component: PrevalencesComponent
      },
      {
        path: 'public/remedies',
        component: RemediesComponent
      },
      {
        path: '**',
        redirectTo: 'public/home'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule {}
