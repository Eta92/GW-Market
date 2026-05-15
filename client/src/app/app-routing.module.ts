import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { HelpComponent } from './pages/help/help.component';
import { HomeComponent } from './pages/home/home.component';
import { ItemComponent } from './pages/item/item.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { SearchComponent } from './pages/search/search.component';
import { ShopComponent } from './pages/shop/shop.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'search',
    component: SearchComponent
  },
  {
    path: 'item/:name',
    component: ItemComponent
  },
  {
    path: 'shop',
    component: ShopComponent
  },
  {
    path: 'shop/showcase',
    component: ShopComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'help',
    component: HelpComponent
  },
  {
    path: 'overview',
    component: OverviewComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
