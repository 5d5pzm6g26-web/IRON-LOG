// ============================================================================
// WorkoutManager
// アプリの最重要画面「トレーニング記録」に関するすべてのロジック。
//   - 種目/セットのCRUD
//   - テンキー入力(numpad)の状態管理
//   - 感想メモ＆完了処理
//   - 過去の記録からのコピー
//   - 保存済み種目からの追加（種目選択モーダル）
//   - YouTubeフォーム動画モーダル
//
// このファイルが肥大化してきたら、上記の各グループごとに
// exerciseManager.js / numpadManager.js のようにさらに分割するとよい。
// ============================================================================

import { appState } from './state.js';
import { qs, toFloatSafe, toIntSafe } from './utils.js';
import {
    SAMPLE_INITIAL_WORKOUT,
    DEFAULT_SET_WEIGHT,
    DEFAULT_SET_REPS,
    MAX_INPUT_LENGTH,
    WEIGHT_STEP
} from './constants.js';
import { saveLocalData } from './dataManager.js';
import { toggleModal, showToast, switchView } from './uiManager.js';
import { startRestTimer } from './timerManager.js';
import { extractYouTubeId } from './utils.js';

// ---------------------------------------------------------------------------
// 補助計算
// ---------------------------------------------------------------------------

/** 自重負荷率を考慮した1セットのボリューム(kg)を計算する */
export function calculateSetVolume(exName, weight, reps) {
    const master = appState.masterExercises.find(m => m.name === exName);
    const bwPct = (master && master.bodyweightPct) ? parseFloat(master.bodyweightPct) : 0;

    let effectiveWeight = toFloatSafe(weight, 0);
    if (bwPct > 0) {
        effectiveWeight += (appState.userWeight * (bwPct / 100));
    }
    return Math.round(effectiveWeight * (toFloatSafe(reps, 0)) * 10) / 10;
}

/** 指定日のワークアウトログが無ければ、サンプルの初期メニューを生成する */
function initDefaultWorkoutForDate(dateStr) {
    if (!appState.workoutLogsByDate[dateStr]) {
        appState.workoutLogsByDate[dateStr] = JSON.parse(JSON.stringify(SAMPLE_INITIAL_WORKOUT));
    }
}

// ---------------------------------------------------------------------------
// メイン描画
// ---------------------------------------------------------------------------

/** トレーニング記録画面全体を再描画する（このアプリの中心的な関数） */
export function renderWorkoutView() {
    const activeDateEl = qs('workout-active-date');
    if (activeDateEl) activeDateEl.innerText = appState.selectedDate;

    let logs = appState.workoutLogsByDate[appState.selectedDate];
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        initDefaultWorkoutForDate(appState.selectedDate);
        logs = appState.workoutLogsByDate[appState.selectedDate] || [];
    }

    if (appState.activeExIndex >= logs.length) {
        appState.activeExIndex = Math.max(0, logs.length - 1);
    }

    let dailyTotalVolume = 0;

    const container = qs('workout-exercise-list-container');
    if (!container) return;
    container.innerHTML = '';

    logs.forEach((ex, exIdx) => {
        if (!ex.sets || !Array.isArray(ex.sets)) ex.sets = [];

        let exVolume = 0;
        ex.sets.forEach(s => {
            exVolume += calculateSetVolume(ex.name, s.weight, s.reps);
        });
        dailyTotalVolume += exVolume;

        const masterMatch = appState.masterExercises.find(m => m.name === ex.name);
        const ytUrl = masterMatch ? masterMatch.youtubeUrl : '';
        const bwPct = masterMatch ? (masterMatch.bodyweightPct || 0) : 0;

        const exCard = document.createElement('div');
        exCard.className = 'bg-slate-800 rounded-2xl border border-slate-700/80 shadow-md overflow-hidden space-y-2 p-3.5';

        exCard.innerHTML = `
            <div class="flex justify-between items-center gap-2 border-b border-slate-700/60 pb-2">
                <div class="flex items-center gap-2 flex-1 truncate">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 whitespace-nowrap">${ex.part || '胸'}</span>
                    <input type="text" value="${ex.name || ''}" onchange="updateExerciseName(${exIdx}, this.value)" class="bg-transparent font-black text-sm text-white focus:bg-slate-900 border-b border-transparent focus:border-brand-500 outline-none w-full max-w-[160px] truncate" placeholder="種目名を入力">
                </div>
                <div class="flex items-center gap-1.5 text-xs">
                    <span class="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-amber-400 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        ${Math.round(exVolume).toLocaleString()}kg
                    </span>
                    ${ytUrl ? `
                        <button onclick="openYouTubeModal('${ex.name}', '${ytUrl}')" class="p-1.5 text-rose-400 hover:text-rose-300 transition" title="YouTube動画">
                            <i class="fa-brands fa-youtube text-sm"></i>
                        </button>
                    ` : ''}
                    <button onclick="deleteExerciseFromWorkout(${exIdx})" class="p-1.5 text-slate-400 hover:text-rose-400 transition" title="種目削除">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>

            ${bwPct > 0 ? `<div class="text-[10px] text-brand-400 font-medium"><i class="fa-solid fa-calculator mr-1"></i>自重負荷率: ${bwPct}% (体重${appState.userWeight}kg換算)</div>` : ''}

            <!-- Sets Table -->
            <div class="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/60 text-xs">
                <div class="grid grid-cols-5 bg-slate-800/80 px-2 py-1.5 text-[10px] font-bold text-slate-400 text-center uppercase">
                    <div>SET</div>
                    <div>重量(kg)</div>
                    <div>回数</div>
                    <div>完了</div>
                    <div>削除</div>
                </div>
                <div class="divide-y divide-slate-800">
                    ${ex.sets.map((s, sIdx) => {
                        const isSelected = (exIdx === appState.activeExIndex && sIdx === appState.activeSetIndex);
                        return `
                            <div class="grid grid-cols-5 px-2 py-2 items-center text-center font-mono transition ${
                                isSelected ? 'bg-brand-500/15 border-l-4 border-brand-500 font-bold' : 'hover:bg-slate-800/40'
                            }">
                                <div onclick="selectActiveSetWithMode(${exIdx}, ${sIdx}, 'weight')" class="font-sans text-slate-400 cursor-pointer text-xs">SET ${sIdx + 1}</div>
                                <div onclick="selectActiveSetWithMode(${exIdx}, ${sIdx}, 'weight')" class="cursor-pointer py-1 rounded ${isSelected && appState.inputMode==='weight' ? 'text-brand-400 font-black underline text-sm bg-brand-500/10' : 'text-slate-100'}">${s.weight}</div>
                                <div onclick="selectActiveSetWithMode(${exIdx}, ${sIdx}, 'reps')" class="cursor-pointer py-1 rounded ${isSelected && appState.inputMode==='reps' ? 'text-brand-400 font-black underline text-sm bg-brand-500/10' : 'text-slate-100'}">${s.reps}</div>
                                <div>
                                    <button onclick="toggleSetComplete(${exIdx}, ${sIdx})" class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition ${
                                        s.completed ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-transparent hover:text-slate-400'
                                    }">
                                        <i class="fa-solid fa-check text-[11px]"></i>
                                    </button>
                                </div>
                                <div>
                                    <button onclick="deleteSetRow(${exIdx}, ${sIdx})" class="w-6 h-6 rounded-md flex items-center justify-center mx-auto text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="セット削除">
                                        <i class="fa-solid fa-trash-can text-[11px]"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button onclick="addSetRowToEx(${exIdx})" class="w-full py-2 text-center text-[11px] font-bold text-brand-400 hover:bg-brand-500/10 border-t border-slate-700/50 transition">
                    <i class="fa-solid fa-plus mr-1"></i> セットを追加
                </button>
            </div>
        `;

        container.appendChild(exCard);
    });

    const dailyTotalVolEl = qs('daily-total-volume');
    if (dailyTotalVolEl) dailyTotalVolEl.innerText = Math.round(dailyTotalVolume).toLocaleString();

    updateKeypadDisplayLabel();
    saveLocalData();
}

// ---------------------------------------------------------------------------
// 種目/セットのCRUD
// ---------------------------------------------------------------------------

export function updateExerciseName(exIdx, nameVal) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx]) {
        logs[exIdx].name = nameVal.trim();
        saveLocalData();
    }
}

export function toggleSetComplete(exIdx, sIdx) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx] && logs[exIdx].sets[sIdx]) {
        logs[exIdx].sets[sIdx].completed = !logs[exIdx].sets[sIdx].completed;
        if (logs[exIdx].sets[sIdx].completed) {
            startRestTimer();
        }
        renderWorkoutView();
    }
}

export function deleteSetRow(exIdx, sIdx) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx] && logs[exIdx].sets) {
        logs[exIdx].sets.splice(sIdx, 1);
        if (appState.activeExIndex === exIdx) {
            if (appState.activeSetIndex >= logs[exIdx].sets.length) {
                appState.activeSetIndex = Math.max(0, logs[exIdx].sets.length - 1);
            }
        }
        renderWorkoutView();
    }
}

export function addSetRowToEx(exIdx) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx]) {
        const sets = logs[exIdx].sets || [];
        const lastSet = sets.length > 0 ? sets[sets.length - 1] : { weight: DEFAULT_SET_WEIGHT, reps: DEFAULT_SET_REPS };
        sets.push({
            setNum: sets.length + 1,
            weight: lastSet.weight,
            reps: lastSet.reps,
            completed: false
        });
        appState.activeExIndex = exIdx;
        appState.activeSetIndex = sets.length - 1;
        appState.isFreshInput = true;
        showNumpad();
        renderWorkoutView();
    }
}

export function deleteExerciseFromWorkout(exIdx) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx]) {
        logs.splice(exIdx, 1);
        renderWorkoutView();
    }
}

// ---------------------------------------------------------------------------
// テンキー(Numpad) 入力
// ---------------------------------------------------------------------------

export function setInputMode(mode) {
    appState.inputMode = mode;
    appState.isFreshInput = true;
    updateKeypadDisplayLabel();
}

export function hideNumpad() {
    const numpad = qs('numpad-container');
    if (numpad) numpad.classList.add('hidden');
}

export function showNumpad() {
    const numpad = qs('numpad-container');
    if (numpad) numpad.classList.remove('hidden');
}

export function selectActiveSetWithMode(exIdx, sIdx, mode) {
    appState.activeExIndex = exIdx;
    appState.activeSetIndex = sIdx;
    appState.inputMode = mode;
    appState.isFreshInput = true;

    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[exIdx] && logs[exIdx].sets && logs[exIdx].sets[sIdx]) {
        const s = logs[exIdx].sets[sIdx];
        appState.inputWeight = String(s.weight);
        appState.inputReps = String(s.reps);
    }

    showNumpad();
    renderWorkoutView();
}

export function updateKeypadDisplayLabel() {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (!logs || logs.length === 0 || !logs[appState.activeExIndex]) {
        hideNumpad();
        return;
    }

    const ex = logs[appState.activeExIndex];
    if (!ex.sets || !ex.sets[appState.activeSetIndex]) {
        hideNumpad();
        return;
    }

    const s = ex.sets[appState.activeSetIndex];

    const labelEl = qs('active-target-label');
    if (labelEl) {
        labelEl.innerText = `${ex.name} - SET ${appState.activeSetIndex + 1}`;
    }

    const valWeightEl = qs('val-weight');
    const valRepsEl = qs('val-reps');
    if (valWeightEl) valWeightEl.innerText = s.weight;
    if (valRepsEl) valRepsEl.innerText = s.reps;

    const btnWeight = qs('input-mode-weight');
    const btnReps = qs('input-mode-reps');

    if (btnWeight && btnReps) {
        if (appState.inputMode === 'weight') {
            btnWeight.className = 'px-2.5 py-1 rounded-md text-xs font-bold transition bg-brand-500 text-white';
            btnReps.className = 'px-2.5 py-1 rounded-md text-xs font-bold transition text-slate-400 hover:text-white';
        } else {
            btnWeight.className = 'px-2.5 py-1 rounded-md text-xs font-bold transition text-slate-400 hover:text-white';
            btnReps.className = 'px-2.5 py-1 rounded-md text-xs font-bold transition bg-brand-500 text-white';
        }
    }
}

export function pressKey(key) {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (!logs || !logs[appState.activeExIndex] || !logs[appState.activeExIndex].sets[appState.activeSetIndex]) return;

    const s = logs[appState.activeExIndex].sets[appState.activeSetIndex];
    let currentValStr = appState.inputMode === 'weight' ? String(s.weight) : String(s.reps);

    if (key === 'backspace') {
        currentValStr = currentValStr.slice(0, -1);
        if (currentValStr === '' || currentValStr === '-') currentValStr = '0';
    } else if (key === 'C') {
        currentValStr = '0';
        appState.isFreshInput = true;
    } else if (key === '+2.5') {
        let num = toFloatSafe(currentValStr, 0);
        num = Math.max(0, num + WEIGHT_STEP);
        currentValStr = String(Math.round(num * 10) / 10);
        appState.isFreshInput = false;
    } else if (key === '-2.5') {
        let num = toFloatSafe(currentValStr, 0);
        num = Math.max(0, num - WEIGHT_STEP);
        currentValStr = String(Math.round(num * 10) / 10);
        appState.isFreshInput = false;
    } else if (key === '.') {
        if (appState.isFreshInput) {
            currentValStr = '0.';
            appState.isFreshInput = false;
        } else if (!currentValStr.includes('.')) {
            currentValStr += '.';
        }
    } else {
        if (appState.isFreshInput || currentValStr === '0') {
            currentValStr = key;
            appState.isFreshInput = false;
        } else {
            if (currentValStr.length < MAX_INPUT_LENGTH) {
                currentValStr += key;
            }
        }
    }

    if (appState.inputMode === 'weight') {
        s.weight = toFloatSafe(currentValStr, 0);
    } else {
        s.reps = toIntSafe(currentValStr, 0);
    }

    renderWorkoutView();
}

export function completeCurrentSet() {
    const logs = appState.workoutLogsByDate[appState.selectedDate];
    if (logs && logs[appState.activeExIndex] && logs[appState.activeExIndex].sets[appState.activeSetIndex]) {
        logs[appState.activeExIndex].sets[appState.activeSetIndex].completed = true;
    }

    startRestTimer();

    if (logs && logs[appState.activeExIndex]) {
        const setsCount = logs[appState.activeExIndex].sets.length;
        if (appState.activeSetIndex + 1 < setsCount) {
            appState.activeSetIndex++;
            appState.isFreshInput = true;
        }
    }

    renderWorkoutView();
}

// ---------------------------------------------------------------------------
// トレーニング完了・感想メモ
// ---------------------------------------------------------------------------

export function openWorkoutMemoModal() {
    const memoInput = qs('workout-memo-input');
    if (memoInput) {
        memoInput.value = appState.workoutMemosByDate[appState.selectedDate] || '';
    }
    toggleModal('workout-memo');
}

export function saveWorkoutMemoAndFinish() {
    const memoInput = qs('workout-memo-input');
    const text = memoInput ? memoInput.value.trim() : '';

    appState.workoutMemosByDate[appState.selectedDate] = text;
    appState.workoutCompletedDates[appState.selectedDate] = true;

    saveLocalData();
    toggleModal('workout-memo');
    showToast('トレーニング完了！感想を記録しました');
    switchView('calendar');
}

// ---------------------------------------------------------------------------
// 過去の記録からコピー
// ---------------------------------------------------------------------------

export function openCopyDateModal() {
    const listContainer = qs('copy-date-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const availableDates = Object.keys(appState.workoutLogsByDate)
        .filter(d => d !== appState.selectedDate && appState.workoutLogsByDate[d] && appState.workoutLogsByDate[d].length > 0)
        .sort()
        .reverse();

    if (availableDates.length === 0) {
        listContainer.innerHTML = `<div class="text-center text-xs text-slate-400 py-6">コピー可能な過去のトレーニング記録がありません</div>`;
    } else {
        availableDates.forEach(dStr => {
            const logs = appState.workoutLogsByDate[dStr];
            const exSummary = logs.map(l => l.name).join(', ');

            const item = document.createElement('div');
            item.className = 'bg-slate-900 hover:bg-slate-700/80 p-3 rounded-xl border border-slate-700 cursor-pointer transition flex justify-between items-center';
            item.onclick = () => copyWorkoutFromDate(dStr);

            item.innerHTML = `
                <div class="truncate max-w-[220px]">
                    <div class="font-mono font-bold text-xs text-white">${dStr}</div>
                    <div class="text-[10px] text-amber-400 truncate">${exSummary}</div>
                </div>
                <span class="text-[10px] font-bold px-2 py-1 bg-brand-500/20 text-brand-400 rounded-lg whitespace-nowrap">コピー</span>
            `;

            listContainer.appendChild(item);
        });
    }

    toggleModal('copy-date');
}

export function copyWorkoutFromDate(sourceDateStr) {
    const sourceLogs = appState.workoutLogsByDate[sourceDateStr];
    if (!sourceLogs) return;

    appState.workoutLogsByDate[appState.selectedDate] = JSON.parse(JSON.stringify(sourceLogs)).map(ex => {
        if (ex.sets) ex.sets.forEach(s => s.completed = false);
        return ex;
    });

    toggleModal('copy-date');
    renderWorkoutView();
    showToast('過去の記録をコピーしました');
}

// ---------------------------------------------------------------------------
// 保存済み種目からの追加（種目選択モーダル）
// ---------------------------------------------------------------------------

export function openSelectExerciseModal() {
    renderMasterExerciseList();
    toggleModal('select-exercise');
}

export function filterMasterExercises(part) {
    appState.currentFilterPart = part;

    document.querySelectorAll('.part-filter-btn').forEach(btn => {
        if (btn.innerText === (part === 'ALL' ? 'すべて' : part)) {
            btn.className = 'part-filter-btn active px-3 py-1 rounded-full bg-brand-500 text-white whitespace-nowrap';
        } else {
            btn.className = 'part-filter-btn px-3 py-1 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 whitespace-nowrap';
        }
    });

    renderMasterExerciseList();
}

export function renderMasterExerciseList() {
    const container = qs('master-exercise-list');
    if (!container) return;
    container.innerHTML = '';

    const list = appState.masterExercises.filter(m =>
        appState.currentFilterPart === 'ALL' || m.part === appState.currentFilterPart
    );

    if (list.length === 0) {
        container.innerHTML = `<div class="text-center text-xs text-slate-400 py-4">登録された種目がありません</div>`;
        return;
    }

    list.forEach(m => {
        const item = document.createElement('div');
        item.className = 'bg-slate-900 hover:bg-slate-700/60 p-3 rounded-xl border border-slate-700/70 flex justify-between items-center transition cursor-pointer';

        const hasYt = !!m.youtubeUrl;

        item.innerHTML = `
            <div onclick="addMasterExerciseToCurrentWorkoutByName('${m.name}')" class="flex-1">
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                    ${m.name}
                    ${hasYt ? '<i class="fa-brands fa-youtube text-rose-500 text-xs"></i>' : ''}
                </div>
                <div class="text-[10px] text-slate-400">${m.bodyweightPct > 0 ? `自重負荷: ${m.bodyweightPct}%` : 'ウェイト種目'}</div>
            </div>
            <div class="flex items-center gap-2">
                ${hasYt ? `
                    <button onclick="event.stopPropagation(); openYouTubeModal('${m.name}', '${m.youtubeUrl}')" class="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs transition">
                        <i class="fa-brands fa-youtube"></i>
                    </button>
                ` : ''}
                <span onclick="addMasterExerciseToCurrentWorkoutByName('${m.name}')" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-brand-400 border border-slate-700">${m.part}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

export function addMasterExerciseToCurrentWorkoutByName(exName) {
    const masterEx = appState.masterExercises.find(m => m.name === exName);
    if (masterEx) addMasterExerciseToCurrentWorkout(masterEx);
}

export function addMasterExerciseToCurrentWorkout(masterEx) {
    if (!appState.workoutLogsByDate[appState.selectedDate]) {
        appState.workoutLogsByDate[appState.selectedDate] = [];
    }

    appState.workoutLogsByDate[appState.selectedDate].push({
        name: masterEx.name,
        part: masterEx.part,
        sets: [
            { setNum: 1, weight: DEFAULT_SET_WEIGHT, reps: DEFAULT_SET_REPS, completed: false },
            { setNum: 2, weight: DEFAULT_SET_WEIGHT, reps: DEFAULT_SET_REPS, completed: false },
            { setNum: 3, weight: DEFAULT_SET_WEIGHT, reps: DEFAULT_SET_REPS, completed: false }
        ]
    });

    toggleModal('select-exercise');
    renderWorkoutView();
    showToast(`種目「${masterEx.name}」を追加しました`);
}

// ---------------------------------------------------------------------------
// YouTube フォーム動画モーダル
// ---------------------------------------------------------------------------

export function openYouTubeModal(title, url) {
    const videoId = extractYouTubeId(url);
    const container = qs('youtube-player-container');
    const modalTitle = qs('youtube-modal-title');

    if (modalTitle) modalTitle.innerHTML = `<i class="fa-brands fa-youtube text-rose-500 mr-2"></i>${title}`;

    if (container) {
        if (videoId) {
            container.innerHTML = `
                <iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        } else {
            container.innerHTML = `<div class="p-6 text-center text-slate-400">有効なYouTube URLが登録されていません</div>`;
        }
    }
    toggleModal('youtube');
}

export function closeYouTubeModal() {
    const container = qs('youtube-player-container');
    if (container) container.innerHTML = '';
    toggleModal('youtube');
}
