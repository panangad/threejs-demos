import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MadboxDemoComponent } from './pages/madbox-demo/madbox-demo.component';
import { CosmicDemoComponent } from './pages/cosmic-demo/cosmic-demo.component';
import { CosmicGalaxyComponent } from './pages/cosmic-galaxy/cosmic-galaxy.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'madbox', component: MadboxDemoComponent },
  { path: 'cosmic', component: CosmicDemoComponent },
  { path: 'cosmic-galaxy', component: CosmicGalaxyComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
