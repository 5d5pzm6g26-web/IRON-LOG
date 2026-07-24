// ============================================================================
// UIManager
// 「画面(View)そのものの切り替え」「モーダルの開閉」「トースト通知」など、
// 特定のドメイン(ワークアウト/タイマー等)に属さない共通UI操作を担当する。
//
// 各マネージャーの render 関数はここから呼び出すが、実処理は各マネージャーに
// 委譲する（UIManager自身はDOMの表示/非表示の切り替えだけに専念する）。
// ============================================================================

import { appState } from './state.js';
import { qs } from './utils.js';
import { VIEW_NAMES, TOAST_DURATION_MS } from './constants.js';
import { renderCalendar } from './calendarManager.js';
import { renderWorkoutView } from './workoutManager.js';
import { updateStandaloneTimerDisplay } from './timerManager.js';
import { populateChartExerciseOptions, renderChart } from './statisticsManager.js';

const ACTIVE_NAV_CLASS = 'text-brand-500 flex flex-col items-center gap-0.5';
const INACTIVE_NAV_CLASS = 'text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5';

/** 指定した画面へ遷移し、ナビゲーションのハイライトと該当画面の再描画を行う */
export function switchView(viewName) {
    appState.activeView = viewName;

    VIEW_NAMES.forEach(v => {
        const el = qs(`view-${v}`);
        if (el) el.classList.add('hidden');

        const navBtn = qs(`nav-${v}`);
        if (navBtn) navBtn.className = INACTIVE_NAV_CLASS;
    });

    const targetEl = qs(`view-${viewName}`);
    if (targetEl) targetEl.classList.remove('hidden');

    const activeNav = qs(`nav-${viewName}`);
    if (activeNav) activeNav.className = ACTIVE_NAV_CLASS;

    if (viewName === 'calendar') renderCalendar();
    if (viewName === 'workout') renderWorkoutView();
    if (viewName === 'timer') updateStandaloneTimerDisplay();
    if (viewName === 'analytics') {
        populateChartExerciseOptions();
        renderChart();
    }
}

/** id指定で `modal-{modalId}` 要素の表示/非表示を切り替える */
export function toggleModal(modalId) {
    const modal = qs(`modal-${modalId}`);
    if (modal) modal.classList.toggle('hidden');
}

/** 画面上部に短時間トースト通知を表示する */
export function showToast(message) {
    const toast = qs('toast-message');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, TOAST_DURATION_MS);
}
