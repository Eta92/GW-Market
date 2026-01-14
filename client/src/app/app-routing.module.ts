import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ItemComponent } from './pages/item/item.component';
import { ShopComponent } from './pages/shop/shop.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
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
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
