import { Component, inject, OnInit, resource } from '@angular/core';
import { SupabaseService, Program, ProgramExercise } from '../../services/supabase';
import { RouterLink } from '@angular/router';
import { TrainingStore } from '../../services/training.store';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  supa = inject(SupabaseService);
  store = inject(TrainingStore);

  async ngOnInit(): Promise<void> {
    const programs = await this.supa.getPrograms();
    this.store.programs.set(programs);
  }

  programs = this.store.programs.asReadonly();

  selectProgram(program: Program) {
    this.store.selectProgram(program);
  }

  selectedProgram = this.store.selectedProgram.asReadonly();

  programExercises = resource({
    params: () => ({ id: this.selectedProgram()?.id }),
    loader: async ({ params }) => {
      if (!params.id) {
        return [] as ProgramExercise[];
      }

      if (this.store.hasExercisesForProgram(params.id)) {
        return this.store.selectedProgramExercises();
      }

      const exercises = await this.supa.getProgramExercises(params.id);
      this.store.setExercisesForProgram(params.id, exercises);
      return exercises;
    },
  });
}
