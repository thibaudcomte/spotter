import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../services/supabase';
import { TrainingStore } from '../../services/training.store';
import { Workout } from '../../models/workout';
import { DatePipe } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-new-workout',
  imports: [DatePipe, FormField],
  templateUrl: './new-workout.html',
  styleUrl: './new-workout.css',
})
export class NewWorkout implements OnInit {
  supa = inject(SupabaseService);
  store = inject(TrainingStore);

  readonly lastProgramWorkoutDate = signal<Date | null>(null);
  readonly workout = signal<Workout>({
    programId: this.store.selectedProgram()?.id!,
    date: new Date().toISOString(),
    exercises: [],
  });
  workoutForm = form(this.workout);

  async ngOnInit() {
    const lastWorkoutDetails = await this.supa.getLastProgramWorkoutDetails(
      this.store.selectedProgram()?.id!,
    );
    this.lastProgramWorkoutDate.set(lastWorkoutDetails ? new Date(lastWorkoutDetails.date) : null);

    const programExercises = this.store.selectedProgramExercises();
    for (const exercise of programExercises) {
      const lastExerciseDetails = lastWorkoutDetails?.exercises.find((e) => e.id === exercise.id);
      const sets: {
        reps: number;
        weight: number;
        lastReps?: number;
        lastWeight?: number;
      }[] = [];
      for (let i = 0; i < exercise.sets; i++) {
        const lastSet = lastExerciseDetails?.sets[i];
        sets.push({
          lastReps: lastSet?.reps,
          lastWeight: lastSet?.weight,
          reps: 0,
          weight: 0,
        });
      }
      this.workout.update((w) => ({
        ...w,
        exercises: [
          ...w.exercises,
          {
            id: exercise.id,
            name: exercise.name,
            sets,
          },
        ],
      }));
    }
  }

  async saveWorkout() {
    const workout = this.workout();
    if (!workout) {
      return;
    }
    try {
      const workoutId = await this.supa.saveWorkout(workout);
      console.log('Workout saved with ID:', workoutId);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }
}
