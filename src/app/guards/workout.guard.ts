import { CanDeactivateFn } from '@angular/router';
import { WorkoutComponent } from '../components/workout/workout.component';

export const workoutGuard: CanDeactivateFn<WorkoutComponent> = (component) => {
  if (component.activeLog()) {
    return confirm('Tienes un entrenamiento activo. ¿Estás seguro de que quieres salir? Se perderá el progreso no guardado.');
  }
  return true;
};
