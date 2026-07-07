import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'workout',
    pathMatch: 'full',
  },
  {
    path: 'workout',
    loadComponent: () =>
      import('./components/workout/workout.component').then(
        (m) => m.WorkoutComponent
      ),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./components/templates/template-list.component').then(
        (m) => m.TemplateListComponent
      ),
  },
  {
    path: 'templates/new',
    loadComponent: () =>
      import('./components/templates/template-editor.component').then(
        (m) => m.TemplateEditorComponent
      ),
  },
  {
    path: 'templates/edit/:id',
    loadComponent: () =>
      import('./components/templates/template-editor.component').then(
        (m) => m.TemplateEditorComponent
      ),
  },
  {
    path: 'data',
    loadComponent: () =>
      import('./components/data/data-management.component').then(
        (m) => m.DataManagementComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
