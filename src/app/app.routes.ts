import { Routes } from '@angular/router';
import { NewWorkout } from './pages/new-workout/new-workout';
import { Home } from './pages/home/home';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home, title: 'Home' },
    { path: 'new-workout', component: NewWorkout, title: 'New Workout' },
];
