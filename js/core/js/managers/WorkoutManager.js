import { Utility } from '../utils/Utility.js';

export class WorkoutManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.workouts = this.dataManager.get('workouts', {});
        this.activeDate = Utility.getTodayString();
    }

    setActiveDate(dateStr) {
        this.activeDate = dateStr;
    }

    getWorkoutForActiveDate() {
        if (!this.workouts[this.activeDate]) {
            this.workouts[this.activeDate] = { memo: '', exercises: [] };
        }
        return this.workouts[this.activeDate];
    }

    addExercise(name) {
        const workout = this.getWorkoutForActiveDate();
        workout.exercises.push({
            id: 'ex_' + Date.now(),
            name: name,
            sets: []
        });
        this.save();
    }

    addSet(exerciseId, weight, reps) {
        const workout = this.getWorkoutForActiveDate();
        const exercise = workout.exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
            exercise.sets.push({ 
                id: 'set_' + Date.now(),
                weight: Number(weight), 
                reps: Number(reps), 
                completed: true 
            });
            this.save();
        }
    }

    save() {
        this.dataManager.set('workouts', this.workouts);
    }
}
