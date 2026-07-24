// ============================================================================
// CalendarManager
// ホーム画面のカレンダー表示、月送り、日付選択、選択日カードの更新を担当する。
// ============================================================================

import { appState } from './state.js';
import { qs, buildDateStr, todayStr } from './utils.js';
import { switchView } from './uiManager.js';

/** カレンダーグリッドと選択日カードを再描画する */
export function renderCalendar() {
    const year = appState.selectedMonth.getFullYear();
    const month = appState.selectedMonth.getMonth();

    const monthYearEl = qs('calendar-month-year');
    if (monthYearEl) {
        monthYearEl.innerText = `${year}年 ${month + 1}月`;
    }

    const daysContainer = qs('calendar-days');
    if (!daysContainer) return;
    daysContainer.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'h-10';
        daysContainer.appendChild(emptyCell);
    }

    const todayString = todayStr();

    for (let day = 1; day <= totalDays; day++) {
        const dayStr = buildDateStr(year, month, day);
        const hasWorkout = appState.workoutLogsByDate[dayStr] && appState.workoutLogsByDate[dayStr].length > 0;
        const isCompleted = appState.workoutCompletedDates[dayStr];
        const isSelected = (dayStr === appState.selectedDate);
        const isToday = (dayStr === todayString);

        const dayCell = document.createElement('div');
        dayCell.onclick = () => selectDate(dayStr);

        let classes = 'h-10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition font-mono relative ';

        if (isSelected) {
            classes += 'bg-brand-500 text-white font-black shadow-md shadow-brand-500/30 scale-105 z-10';
        } else if (isToday) {
            classes += 'bg-slate-700/80 border border-brand-500/50 text-brand-400 font-bold';
        } else {
            classes += 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200';
        }

        dayCell.className = classes;

        let statusBadgeHtml = '';
        if (isCompleted) {
            statusBadgeHtml = `<i class="fa-solid fa-check text-[9px] ${isSelected ? 'text-white' : 'text-emerald-400'} mt-0.5"></i>`;
        } else if (hasWorkout) {
            statusBadgeHtml = `<div class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'} mt-0.5"></div>`;
        }

        dayCell.innerHTML = `
            <span>${day}</span>
            ${statusBadgeHtml}
        `;

        daysContainer.appendChild(dayCell);
    }

    updateSelectedDateCard();
}

/** 表示中の月を+1/-1する */
export function changeMonth(delta) {
    appState.selectedMonth.setMonth(appState.selectedMonth.getMonth() + delta);
    renderCalendar();
}

/** カレンダー上の日付をクリックしたときの選択処理 */
export function selectDate(dateStr) {
    appState.selectedDate = dateStr;
    renderCalendar();
}

/** 「選択中の日付」カードと感想メモカードの表示を更新する */
export function updateSelectedDateCard() {
    const dateDisplay = qs('selected-date-display');
    const dateStatus = qs('selected-date-status');

    if (dateDisplay) dateDisplay.innerText = appState.selectedDate;

    const logs = appState.workoutLogsByDate[appState.selectedDate];
    const isCompleted = appState.workoutCompletedDates[appState.selectedDate];

    if (dateStatus) {
        if (logs && logs.length > 0) {
            const exNames = logs.map(l => l.name).join(', ');
            dateStatus.innerText = `${isCompleted ? '✓ 完了 - ' : ''}${logs.length}種目: ${exNames}`;
            dateStatus.className = `text-xs ${isCompleted ? 'text-emerald-400' : 'text-amber-400'} font-bold truncate max-w-[200px] mt-0.5`;
        } else {
            dateStatus.innerText = '記録なし';
            dateStatus.className = 'text-xs text-slate-400 mt-0.5';
        }
    }

    const memoCard = qs('selected-date-memo-card');
    const memoText = qs('selected-date-memo-text');
    const currentMemo = appState.workoutMemosByDate[appState.selectedDate];

    if (memoCard && memoText) {
        if (currentMemo && currentMemo.trim() !== '') {
            memoText.innerText = currentMemo;
            memoCard.classList.remove('hidden');
        } else {
            memoCard.classList.add('hidden');
        }
    }
}

/** 「記録を開く」ボタン: 選択中の日付のままトレーニング記録画面へ遷移する */
export function startWorkoutForSelectedDate() {
    switchView('workout');
}
