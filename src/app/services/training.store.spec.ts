import { describe, expect, it } from 'vitest';
import { TrainingStore } from './training.store';
import { Program } from './supabase';

describe('TrainingStore', () => {
  it('stores exercises by program and exposes them when a program is selected', () => {
    const store = new TrainingStore();
    const program: Program = { id: 1, name: 'Strength' };
    const exercises = [{ id: 10, name: 'Squat', sets: 3, reps: 5 }];

    store.setExercisesForProgram(program.id, exercises);
    store.selectProgram(program);

    expect(store.selectedProgram()).toEqual(program);
    expect(store.selectedProgramExercises()).toEqual(exercises);
    expect(store.hasExercisesForProgram(program.id)).toBe(true);
  });
});
