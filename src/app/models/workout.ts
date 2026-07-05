export type Workout = {
  programId: number;
  date: string;
  exercises: {
    id: number;
    name: string;
    sets: {
      reps?: number;
      weight?: number;
      lastReps?: number;
      lastWeight?: number;
    }[];
  }[];
};
