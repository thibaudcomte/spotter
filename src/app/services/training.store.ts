import { Service, signal } from "@angular/core";
import { Program, ProgramExercise } from "./supabase";

@Service()
export class TrainingStore {
    readonly programs = signal<Program[]>([]);
    readonly selectedProgram = signal<Program | null>(null);
    readonly selectedProgramExercises = signal<ProgramExercise[]>([]);
    readonly exerciseCache = signal<Record<number, ProgramExercise[]>>({});

    selectProgram(program: Program | null) {
        this.selectedProgram.set(program);

        if (!program) {
            this.selectedProgramExercises.set([]);
            return;
        }

        const cachedExercises = this.exerciseCache()[program.id];
        if (cachedExercises) {
            this.selectedProgramExercises.set(cachedExercises);
            return;
        }

        this.selectedProgramExercises.set([]);
    }

    setExercisesForProgram(programId: number, exercises: ProgramExercise[]) {
        this.exerciseCache.update((cache) => ({ ...cache, [programId]: exercises }));
        const selectedProgram = this.selectedProgram();

        if (selectedProgram?.id === programId) {
            this.selectedProgramExercises.set(exercises);
        }
    }

    hasExercisesForProgram(programId: number): boolean {
        return !!this.exerciseCache()[programId];
    }
}