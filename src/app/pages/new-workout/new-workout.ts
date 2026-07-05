import { Component, inject, input, OnInit, resource, signal } from '@angular/core';
import { ProgramExercise, SupabaseService } from '../../services/supabase';
import { TrainingStore } from '../../services/training.store';
import { Workout } from '../../models/workout';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-new-workout',
  imports: [DatePipe],
  templateUrl: './new-workout.html',
  styleUrl: './new-workout.css',
})
export class NewWorkout implements OnInit {
  supa = inject(SupabaseService);
  store = inject(TrainingStore);

  readonly lastProgramWorkoutDate = signal<Date | null>(null);
  readonly workout = signal<Workout | null>(null);

  async ngOnInit() {
    const lastWorkoutDetails = await this.supa.getLastProgramWorkoutDetails(
      this.store.selectedProgram()?.id!,
    );
    this.lastProgramWorkoutDate.set(lastWorkoutDetails ? new Date(lastWorkoutDetails.date) : null);
    const workout: Workout = {
      programId: this.store.selectedProgram()?.id!,
      date: new Date().toISOString(),
      exercises: [],
    };
    const programExercises = this.store.selectedProgramExercises();
    for (const exercise of programExercises) {
      const lastExerciseDetails = lastWorkoutDetails?.exercises.find((e) => e.id === exercise.id);
      const sets: {
        reps?: number;
        weight?: number;
        lastReps?: number;
        lastWeight?: number;
      }[] = [];
      for (let i = 0; i < exercise.sets; i++) {
        const lastSet = lastExerciseDetails?.sets[i];
        sets.push({
          lastReps: lastSet?.reps,
          lastWeight: lastSet?.weight,
        });
      }
      workout.exercises.push({
        id: exercise.id,
        name: exercise.name,
        sets,
      });
      this.workout.set(workout);
    }
  }
}
