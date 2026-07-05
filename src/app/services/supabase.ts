import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../models/database.types';

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
      .select('id, default_sets, default_reps, exercises(name)')
      .eq('program_id', programId);

    if (error) {
      console.error('Error fetching program exercises:', error);
      throw new Error(error.message);
    }

    return data.map((row) => ({
      id: row.id,
      name: row.exercises.name,
      sets: row.default_sets ?? 0,
      reps: row.default_reps ?? 0,
    })) as ProgramExercise[];
  }

  async getLastProgramWorkoutDetails(programId: number) : Promise<LastProgramWorkoutDetails | null> {
    const { data, error } = await this.supabase
      .from('workouts')
      .select('id, program_id, performed_at, workout_exercises(id, exercise_sets(reps, weight), exercises(name))')
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
        id: exercise.id,
        name: exercise.exercises.name,
        sets: exercise.exercise_sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
        })),
      })),
    } as LastProgramWorkoutDetails;
  }
}
