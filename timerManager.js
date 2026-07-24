// ============================================================================
// TimerManager
// インターバルタイマーに関する全ロジック。
//   - セット完了時に自動で始まる「休憩タイマー」
//   - タイマー画面で完結する「連続インターバルタイマー」(WORK→REST→…→COMPLETE)
//   - Web Audio APIによるビープ音
//   - カスタムプリセットの保存/読込/編集/削除
// ============================================================================

import { appState } from './state.js';
import { qs, formatSeconds, toIntSafe } from './utils.js';
import { BEEP_COUNTDOWN_SECONDS } from './constants.js';
import { saveLocalData } from './dataManager.js';
import { showToast, toggleModal } from './uiManager.js';

// ---------------------------------------------------------------------------
// サウンド
// ---------------------------------------------------------------------------

/** Web Audio APIでビープ音を鳴らす。AudioContextは初回利用時に遅延生成する */
export function playBeep(freq = 800, duration = 0.1, type = 'sine') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!appState.audioCtx) {
            appState.audioCtx = new AudioCtx();
        }
        if (appState.audioCtx.state === 'suspended') {
            appState.audioCtx.resume();
        }
        const osc = appState.audioCtx.createOscillator();
        const gain = appState.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, appState.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, appState.audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(appState.audioCtx.destination);
        osc.start();
        osc.stop(appState.audioCtx.currentTime + duration);
    } catch (e) {
        console.log('Audio playback error:', e);
    }
}

// ---------------------------------------------------------------------------
// 設定同期
// ---------------------------------------------------------------------------

/** 設定画面の入力欄(運動秒/休憩秒/セット数)から appState.timer へ反映する */
export function updateTimerSettingsFromInputs() {
    const wInput = toIntSafe(qs('timer-work-sec').value, NaN);
    const rInput = toIntSafe(qs('timer-rest-sec').value, NaN);
    const sInput = toIntSafe(qs('timer-sets-count').value, NaN);

    const w = isNaN(wInput) ? 30 : Math.max(1, wInput);
    const r = isNaN(rInput) ? 0 : Math.max(0, rInput);
    const s = isNaN(sInput) ? 4 : Math.max(1, sInput);

    appState.timer.workSec = w;
    appState.timer.restSec = r;
    appState.timer.totalSets = s;

    if (!appState.timer.active) {
        appState.timer.seconds = w;
        appState.timer.totalSeconds = w;
        appState.timer.phase = 'WORK';
        appState.timer.currentSet = 1;
    }
    updateStandaloneTimerDisplay();
}

// ---------------------------------------------------------------------------
// 休憩タイマー（セット完了時に自動起動）
// ---------------------------------------------------------------------------

export function startRestTimer() {
    clearInterval(appState.timer.interval);
    const restSec = appState.timer.restSec !== undefined ? appState.timer.restSec : 90;

    if (restSec <= 0) {
        appState.timer.active = false;
        updateTimerDisplay();
        return;
    }

    appState.timer.seconds = restSec;
    appState.timer.totalSeconds = restSec;
    appState.timer.phase = 'REST';
    appState.timer.active = true;

    updateTimerDisplay();

    appState.timer.interval = setInterval(() => {
        appState.timer.seconds--;

        if (BEEP_COUNTDOWN_SECONDS.includes(appState.timer.seconds)) {
            playBeep(700, 0.08);
        }

        updateTimerDisplay();

        if (appState.timer.seconds <= 0) {
            playBeep(1200, 0.4, 'triangle');
            stopRestTimer();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
            showToast('インターバル終了！');
        }
    }, 1000);
}

export function stopRestTimer() {
    clearInterval(appState.timer.interval);
    appState.timer.active = false;
    updateTimerDisplay();
}

// ---------------------------------------------------------------------------
// 表示更新
// ---------------------------------------------------------------------------

/** ヘッダーの常駐タイマーバッジを更新する（他画面にいてもタイマー進行がわかるように） */
export function updateTimerDisplay() {
    const formatted = formatSeconds(appState.timer.seconds);

    const displayHeader = qs('timer-display');
    if (displayHeader) displayHeader.innerText = formatted;

    const badge = qs('timer-badge');
    if (badge) {
        if (appState.timer.active) {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        } else {
            badge.classList.add('hidden');
        }
    }

    updateStandaloneTimerDisplay();
}

/** タイマー画面(view-timer)自体の表示を更新する */
export function updateStandaloneTimerDisplay() {
    const formatted = formatSeconds(appState.timer.seconds);

    const stDisplay = qs('timer-standalone-display');
    if (stDisplay) stDisplay.innerText = formatted;

    const stBtn = qs('timer-toggle-btn');
    if (stBtn) {
        if (appState.timer.active) {
            stBtn.innerHTML = `<i class="fa-solid fa-pause mr-1.5"></i> 一時停止`;
            stBtn.className = 'px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition shadow-lg active:scale-95';
        } else {
            stBtn.innerHTML = `<i class="fa-solid fa-play mr-1.5"></i> スタート`;
            stBtn.className = 'px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition shadow-lg active:scale-95';
        }
    }

    const badgeEl = qs('timer-phase-badge');
    if (badgeEl) {
        if (appState.timer.phase === 'WORK') {
            badgeEl.innerText = '🔥 トレーニング中';
            badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-[10px] font-bold text-brand-400';
        } else if (appState.timer.phase === 'REST') {
            badgeEl.innerText = '☕ 休憩中';
            badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-400';
        } else if (appState.timer.phase === 'COMPLETE') {
            badgeEl.innerText = '🎉 完了';
            badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400';
        } else {
            badgeEl.innerText = '待機中';
            badgeEl.className = 'px-2.5 py-0.5 rounded-full bg-slate-700 text-[10px] font-bold text-slate-300';
        }
    }

    const curSetEl = qs('timer-current-set');
    const totSetsEl = qs('timer-total-sets');

    if (curSetEl) curSetEl.innerText = appState.timer.currentSet;
    if (totSetsEl) totSetsEl.innerText = appState.timer.totalSets;

    const progressBar = qs('timer-standalone-progress');
    if (progressBar && appState.timer.totalSeconds > 0) {
        const pct = Math.max(0, (appState.timer.seconds / appState.timer.totalSeconds) * 100);
        progressBar.style.width = `${pct}%`;
    }

    renderCustomTimerPresets();
}

// ---------------------------------------------------------------------------
// 連続インターバルタイマー（WORK → REST → … → COMPLETE）
// ---------------------------------------------------------------------------

export function toggleStandaloneTimer() {
    if (appState.timer.active) {
        clearInterval(appState.timer.interval);
        appState.timer.active = false;
        updateTimerDisplay();
    } else {
        if (appState.timer.phase === 'COMPLETE' || appState.timer.seconds <= 0) {
            resetStandaloneTimer();
        }
        appState.timer.active = true;

        appState.timer.interval = setInterval(() => {
            appState.timer.seconds--;

            if (BEEP_COUNTDOWN_SECONDS.includes(appState.timer.seconds)) {
                playBeep(750, 0.08);
            }

            if (appState.timer.seconds <= 0) {
                playBeep(1200, 0.35, 'triangle');
                advanceTimerPhase();
            }

            updateTimerDisplay();
        }, 1000);

        updateTimerDisplay();
    }
}

/** WORK終了→REST開始、REST終了→次セットorCOMPLETE、という状態遷移 */
export function advanceTimerPhase() {
    if (appState.timer.phase === 'WORK') {
        if (appState.timer.restSec > 0) {
            appState.timer.phase = 'REST';
            appState.timer.seconds = appState.timer.restSec;
            appState.timer.totalSeconds = appState.timer.restSec;
            showToast(`セット ${appState.timer.currentSet} トレーニング完了！休憩に入ります`);
        } else {
            advanceToNextSetOrComplete();
        }
    } else if (appState.timer.phase === 'REST') {
        advanceToNextSetOrComplete();
    }
}

export function advanceToNextSetOrComplete() {
    if (appState.timer.currentSet < appState.timer.totalSets) {
        appState.timer.currentSet++;
        appState.timer.phase = 'WORK';
        appState.timer.seconds = appState.timer.workSec;
        appState.timer.totalSeconds = appState.timer.workSec;
        showToast(`セット ${appState.timer.currentSet} トレーニング開始！`);
    } else {
        appState.timer.phase = 'COMPLETE';
        appState.timer.active = false;
        clearInterval(appState.timer.interval);
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
        showToast('全セット完了！お疲れ様でした！');
    }
}

export function resetStandaloneTimer() {
    clearInterval(appState.timer.interval);
    appState.timer.active = false;
    updateTimerSettingsFromInputs();
    updateTimerDisplay();
}

// ---------------------------------------------------------------------------
// カスタム保存プリセット
// ---------------------------------------------------------------------------

export function saveCurrentTimerAsPreset() {
    const nameInput = qs('preset-name-input');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
        showToast('プリセット名を入力してください');
        return;
    }

    const wVal = toIntSafe(qs('timer-work-sec').value, NaN);
    const rVal = toIntSafe(qs('timer-rest-sec').value, NaN);
    const sVal = toIntSafe(qs('timer-sets-count').value, NaN);

    const w = isNaN(wVal) ? 30 : Math.max(1, wVal);
    const r = isNaN(rVal) ? 0 : Math.max(0, rVal);
    const s = isNaN(sVal) ? 4 : Math.max(1, sVal);

    const newPreset = {
        id: 'preset_' + Date.now(),
        name: name,
        workSec: w,
        restSec: r,
        sets: s
    };

    appState.savedTimerPresets.push(newPreset);
    if (nameInput) nameInput.value = '';
    saveLocalData();
    renderCustomTimerPresets();
    showToast(`プリセット「${name}」を保存しました`);
}

export function loadCustomTimerPreset(presetId) {
    const preset = appState.savedTimerPresets.find(p => p.id === presetId);
    if (!preset) return;

    clearInterval(appState.timer.interval);
    appState.timer.active = false;

    const wInput = qs('timer-work-sec');
    const rInput = qs('timer-rest-sec');
    const sInput = qs('timer-sets-count');

    if (wInput) wInput.value = preset.workSec;
    if (rInput) rInput.value = preset.restSec;
    if (sInput) sInput.value = preset.sets;

    updateTimerSettingsFromInputs();
    showToast(`「${preset.name}」に切り替えました`);
}

export function deleteCustomTimerPreset(presetId, event) {
    if (event) event.stopPropagation();
    appState.savedTimerPresets = appState.savedTimerPresets.filter(p => p.id !== presetId);
    saveLocalData();
    renderCustomTimerPresets();
    showToast('プリセットを削除しました');
}

export function openEditPresetModal(presetId, event) {
    if (event) event.stopPropagation();
    const preset = appState.savedTimerPresets.find(p => p.id === presetId);
    if (!preset) return;

    qs('edit-preset-id').value = preset.id;
    qs('edit-preset-name').value = preset.name;
    qs('edit-preset-work').value = preset.workSec;
    qs('edit-preset-rest').value = preset.restSec;
    qs('edit-preset-sets').value = preset.sets;

    toggleModal('edit-preset');
}

export function saveEditedPreset() {
    const id = qs('edit-preset-id').value;
    const name = qs('edit-preset-name').value.trim();
    const wVal = toIntSafe(qs('edit-preset-work').value, NaN);
    const rVal = toIntSafe(qs('edit-preset-rest').value, NaN);
    const sVal = toIntSafe(qs('edit-preset-sets').value, NaN);

    if (!name) {
        showToast('プリセット名を入力してください');
        return;
    }

    const preset = appState.savedTimerPresets.find(p => p.id === id);
    if (preset) {
        preset.name = name;
        preset.workSec = isNaN(wVal) ? 30 : Math.max(1, wVal);
        preset.restSec = isNaN(rVal) ? 0 : Math.max(0, rVal);
        preset.sets = isNaN(sVal) ? 4 : Math.max(1, sVal);

        saveLocalData();
        renderCustomTimerPresets();
        toggleModal('edit-preset');
        showToast(`プリセット「${name}」を更新しました`);
    }
}

export function renderCustomTimerPresets() {
    const container = qs('timer-custom-presets-list');
    if (!container) return;
    container.innerHTML = '';

    if (!appState.savedTimerPresets || appState.savedTimerPresets.length === 0) {
        container.innerHTML = `<div class="text-center text-xs text-slate-500 py-3">保存されたマイプリセットはありません</div>`;
        return;
    }

    appState.savedTimerPresets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'bg-slate-900 hover:bg-slate-700/70 p-3 rounded-xl border border-slate-700/80 flex justify-between items-center transition cursor-pointer';
        item.onclick = () => loadCustomTimerPreset(preset.id);

        item.innerHTML = `
            <div>
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                    <i class="fa-solid fa-stopwatch text-amber-400 text-[11px]"></i> ${preset.name}
                </div>
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                    運動: ${preset.workSec}秒 | 休憩: ${preset.restSec}秒 | ${preset.sets}セット
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <button onclick="loadCustomTimerPreset('${preset.id}')" class="px-2.5 py-1 rounded-lg bg-brand-500/20 hover:bg-brand-500 text-brand-400 hover:text-white font-bold text-[10px] transition">
                    適用
                </button>
                <button onclick="openEditPresetModal('${preset.id}', event)" class="p-1 text-slate-400 hover:text-amber-400 transition" title="編集">
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                <button onclick="deleteCustomTimerPreset('${preset.id}', event)" class="p-1 text-slate-500 hover:text-rose-400 transition" title="削除">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}
