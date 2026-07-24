// ============================================================================
// DataManager
// 永続化に関する処理を一手に引き受けるモジュール。
//
// 設計意図:
//   - 現在は LocalStorage だが、将来 Firebase / Firestore 等に差し替える際は
//     このファイルの中身だけを差し替えれば良いようにする（呼び出し側=他の
//     マネージャーは save()/load() のインターフェースしか知らない）。
//   - 保存するキーは STORAGE_KEY に一本化。命名は camelCase で統一。
// ============================================================================

import { STORAGE_KEY } from './constants.js';
import { appState } from './state.js';
import { qs } from './utils.js';

/**
 * 現在の appState のうち「永続化すべきフィールドだけ」を LocalStorage に保存する。
 * タイマーの interval ハンドルや DOM 参照など、保存すべきでない一時的な値は含めない。
 */
export function saveLocalData() {
    try {
        const persistedShape = {
            masterExercises: appState.masterExercises,
            workoutLogsByDate: appState.workoutLogsByDate,
            workoutMemosByDate: appState.workoutMemosByDate,
            workoutCompletedDates: appState.workoutCompletedDates,
            savedTimerPresets: appState.savedTimerPresets,
            userWeight: appState.userWeight,
            userFat: appState.userFat
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedShape));
    } catch (e) {
        console.error('LocalStorage write failed:', e);
    }
}

/**
 * LocalStorage から状態を読み込み、appState にマージする。
 * 保存データが存在しない/壊れている場合は appState の初期値をそのまま使う。
 */
export function loadLocalData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const parsed = JSON.parse(saved);

        if (parsed.masterExercises) appState.masterExercises = parsed.masterExercises;
        if (parsed.workoutLogsByDate) appState.workoutLogsByDate = parsed.workoutLogsByDate;
        if (parsed.workoutMemosByDate) appState.workoutMemosByDate = parsed.workoutMemosByDate;
        if (parsed.workoutCompletedDates) appState.workoutCompletedDates = parsed.workoutCompletedDates;
        if (parsed.savedTimerPresets) appState.savedTimerPresets = parsed.savedTimerPresets;

        if (parsed.userWeight) {
            appState.userWeight = parsed.userWeight;
            const wEl = qs('user-weight');
            if (wEl) wEl.value = appState.userWeight;
        }
        if (parsed.userFat) {
            appState.userFat = parsed.userFat;
            const fEl = qs('user-fat');
            if (fEl) fEl.value = appState.userFat;
        }
    } catch (e) {
        console.error('LocalStorage read failed:', e);
    }
}

/**
 * 保存データを全て消去し、リロードして初期状態へ戻す。
 * @param {(msg: string) => void} showToast - 完了メッセージ表示用コールバック（循環import回避のため注入）
 */
export function clearAllData(showToast) {
    localStorage.removeItem(STORAGE_KEY);
    if (showToast) showToast('データを初期化しました');
    setTimeout(() => location.reload(), 1000);
}
