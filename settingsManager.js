// ============================================================================
// SettingsManager
// 設定画面: 身体データ管理、種目のカスタム登録、データ初期化を担当する。
// ============================================================================

import { appState } from './state.js';
import { qs, toFloatSafe } from './utils.js';
import { DEFAULT_EXERCISE_PART } from './constants.js';
import { saveLocalData, clearAllData as clearAllDataFromStorage } from './dataManager.js';
import { showToast } from './uiManager.js';
import { renderWorkoutView } from './workoutManager.js';

/** 新しい種目をマスター種目リストに登録する */
export function addNewExercise() {
    const nameEl = qs('new-ex-name');
    const partEl = qs('new-ex-part');
    const bwEl = qs('new-ex-bw');
    const ytEl = qs('new-ex-youtube');

    const name = nameEl ? nameEl.value.trim() : '';
    const part = partEl ? partEl.value : DEFAULT_EXERCISE_PART;
    const bw = bwEl ? toFloatSafe(bwEl.value, 0) : 0;
    const yt = ytEl ? ytEl.value.trim() : '';

    if (name) {
        appState.masterExercises.push({
            id: 'ex_' + Date.now(),
            name: name,
            part: part,
            bodyweightPct: bw,
            youtubeUrl: yt
        });
        if (nameEl) nameEl.value = '';
        if (bwEl) bwEl.value = '';
        if (ytEl) ytEl.value = '';
        saveLocalData();
        renderWorkoutView();
        showToast(`種目「${name}」を登録しました`);
    }
}

/** 体重・体脂肪率を保存する（自重種目のボリューム換算に使用） */
export function saveBodyData() {
    const w = qs('user-weight');
    const f = qs('user-fat');
    if (w) appState.userWeight = toFloatSafe(w.value, 70.0);
    if (f) appState.userFat = toFloatSafe(f.value, 15.0);
    saveLocalData();
    renderWorkoutView();
    showToast('身体データを保存しました');
}

/** 全データを初期化する（確認なしで即実行 — 元コードの挙動を維持） */
export function clearAllData() {
    clearAllDataFromStorage(showToast);
}
