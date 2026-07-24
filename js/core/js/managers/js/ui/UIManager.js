import { Utility } from '../utils/Utility.js';

export class UIManager {
    constructor(managers) {
        this.managers = managers; // { workout: WorkoutManager, ... }
        this.bindEvents();
    }

    bindEvents() {
        // --- ナビゲーション制御 ---
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewName = e.currentTarget.id.replace('nav-', '');
                this.switchView(viewName);
            });
        });

        // --- カレンダー画面のイベント ---
        const btnStartToday = document.getElementById('btn-start-today');
        if (btnStartToday) {
            btnStartToday.addEventListener('click', () => {
                this.managers.workout.setActiveDate(Utility.getTodayString());
                this.switchView('workout');
            });
        }

        // --- ワークアウト画面のイベント ---
        const btnAddExercise = document.getElementById('btn-add-exercise');
        if (btnAddExercise) {
            btnAddExercise.addEventListener('click', () => {
                // 本来はモーダル等を出しますが、サンプルとしてプロンプトを使用
                const name = prompt('追加する種目名を入力してください (例: ベンチプレス)');
                if (name) {
                    this.managers.workout.addExercise(name);
                    this.renderWorkoutView(); // データを更新したら再描画
                }
            });
        }
    }

    switchView(viewName) {
        // 全セクションを非表示にし、対象だけ表示
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${viewName}`).classList.remove('hidden');

        // ナビゲーションのハイライト更新
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('text-brand-500');
            el.classList.add('text-slate-400');
        });
        document.getElementById(`nav-${viewName}`).classList.remove('text-slate-400');
        document.getElementById(`nav-${viewName}`).classList.add('text-brand-500');
        
        // 表示する画面に応じたレンダリング処理
        if (viewName === 'workout') {
            this.renderWorkoutView();
        }
    }

    renderWorkoutView() {
        const activeDate = this.managers.workout.activeDate;
        const workout = this.managers.workout.getWorkoutForActiveDate();
        
        // 日付の更新
        document.getElementById('workout-active-date').textContent = activeDate;
        
        // リストの描画
        const listContainer = document.getElementById('exercise-list');
        listContainer.innerHTML = ''; // リセット

        if (workout.exercises.length === 0) {
            listContainer.innerHTML = '<p class="text-slate-500 text-center py-4">種目がありません。追加してください。</p>';
            return;
        }

        workout.exercises.forEach(ex => {
            const exEl = document.createElement('div');
            exEl.className = 'bg-slate-800 rounded-lg p-4 border border-slate-700';
            
            // 種目ヘッダー
            let html = `<h3 class="font-bold text-brand-500 mb-2">${ex.name}</h3>`;
            
            // セットのリスト
            if (ex.sets.length > 0) {
                html += '<div class="space-y-2 mb-3">';
                ex.sets.forEach((set, index) => {
                    html += `
                        <div class="flex justify-between items-center text-sm bg-slate-900 p-2 rounded">
                            <span class="text-slate-400">Set ${index + 1}</span>
                            <span>${set.weight} kg × ${set.reps} reps</span>
                        </div>
                    `;
                });
                html += '</div>';
            }

            // セット追加ボタン (HTMLの組み立て)
            html += `
                <div class="flex gap-2">
                    <input type="number" id="weight-${ex.id}" placeholder="kg" class="w-1/2 bg-slate-900 border border-slate-600 rounded p-2 text-center">
                    <input type="number" id="reps-${ex.id}" placeholder="reps" class="w-1/2 bg-slate-900 border border-slate-600 rounded p-2 text-center">
                    <button data-ex-id="${ex.id}" class="btn-add-set bg-brand-500 text-white px-4 rounded font-bold">＋</button>
                </div>
            `;
            exEl.innerHTML = html;
            listContainer.appendChild(exEl);
        });

        // 動的に生成したボタンにイベントを付与
        document.querySelectorAll('.btn-add-set').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exId = e.target.getAttribute('data-ex-id');
                const weight = document.getElementById(`weight-${exId}`).value;
                const reps = document.getElementById(`reps-${exId}`).value;
                
                if (weight && reps) {
                    this.managers.workout.addSet(exId, weight, reps);
                    this.renderWorkoutView(); // 状態が変わったら再描画
                }
            });
        });
    }
}
