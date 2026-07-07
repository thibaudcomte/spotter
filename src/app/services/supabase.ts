import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../models/database.types';
import { Workout } from '../models/workout';

export type Program = { id: number; name: string };
export type ProgramExercise = { id: number; name: string; sets: number; reps: number };
export type LastProgramWorkoutDetails = {
  id: number;
  program_id: number;
  date: string;
  exercises: {
    id: number;
    name: string;
    sets: {
      reps: number;
      weight: number;
    }[];
  }[];
};

@Service()
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  constructor() {
    this.supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseKey);
  }

  async getPrograms(): Promise<Program[]> {
    const { data, error } = await this.supabase.from('programs').select('id, name');

    if (error) {
      console.error('Error fetching programs:', error);
      throw new Error(error.message);
    }

    return data as Program[];
  }

  async getProgramExercises(programId: number): Promise<ProgramExercise[]> {
    const { data, error } = await this.supabase
      .from('program_exercises')
      .select('id, default_sets, default_reps, exercises(id, name)')
      .eq('program_id', programId);

    if (error) {
      console.error('Error fetching program exercises:', error);
      throw new Error(error.message);
    }

    return data.map((row) => ({
      id: row.exercises.id,
      name: row.exercises.name,
      sets: row.default_sets ?? 0,
      reps: row.default_reps ?? 0,
    })) as ProgramExercise[];
  }

  async getLastProgramWorkoutDetails(programId: number) : Promise<LastProgramWorkoutDetails | null> {
    const { data, error } = await this.supabase
      .from('workouts')
      .select('id, program_id, performed_at, workout_exercises(exercise_sets(reps, weight), exercises(id, name))')
      .eq('program_id', programId)
      .order('performed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last program workout details:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      program_id: data.program_id,
      date: data.performed_at,
      exercises: data.workout_exercises.map((exercise) => ({
        id: exercise.exercises.id,
        name: exercise.exercises.name,
        sets: exercise.exercise_sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
        })),
      })),
    } as LastProgramWorkoutDetails;
  }

  async saveWorkout(workout: Workout): Promise<number> {
    const { data: workoutData, error: workoutError } = await this.supabase
      .from('workouts')
      .insert({
        program_id: workout.programId,
        performed_at: workout.date,
        notes: null,
      })
      .select('id')
      .single();

    if (workoutError || !workoutData) {
      console.error('Error creating workout:', workoutError);
      throw new Error(workoutError?.message ?? 'Unable to create workout');
    }

    const workoutId = workoutData.id;

    for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
      const { data: workoutExerciseData, error: workoutExerciseError } = await this.supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          position: exerciseIndex,
          notes: null,
        })
        .select('id')
        .single();

      if (workoutExerciseError || !workoutExerciseData) {
        console.error('Error creating workout exercise:', workoutExerciseError);
        throw new Error(workoutExerciseError?.message ?? 'Unable to create workout exercise');
      }

      const workoutExerciseId = workoutExerciseData.id;

      for (const [setIndex, set] of exercise.sets.entries()) {
        const { error: setError } = await this.supabase.from('exercise_sets').insert({
          workout_exercise_id: workoutExerciseId,
          set_index: setIndex,
          reps: set.reps ?? null,
          weight: set.weight ?? null,
          notes: null,
          rpe: null,
        });

        if (setError) {
          console.error('Error creating exercise set:', setError);
          throw new Error(setError.message);
        }
      }
    }

    return workoutId;
  }
}
