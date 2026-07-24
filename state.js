// ============================================================================
// state.js
// アプリ全体で共有する唯一の状態オブジェクト（Single Source of Truth）。
// 元コードの `appState` をそのまま移設。構造は変更していない
// （LocalStorageに保存済みの既存ユーザーデータとの互換性を保つため）。
//
// 将来 Firebase 等に移行する場合も、まずはここに集約された構造を
// そのままドキュメントスキーマの叩き台として使える。
// ============================================================================

import {
    DEFAULT_MASTER_EXERCISES,
    DEFAULT_TIMER_PRESETS,
    DEFAULT_TIMER_WORK_SEC,
    DEFAULT_TIMER_REST_SEC,
    DEFAULT_TIMER_TOTAL_SETS
} from './constants.js';

import { todayStr } from './utils.js';

export const appState = {
    selectedDate: todayStr(),
    selectedMonth: new Date(),
    activeView: 'calendar',
    userWeight: 70.0,
    userFat: 15.0,

    masterExercises: JSON.parse(JSON.stringify(DEFAULT_MASTER_EXERCISES)),

    workoutLogsByDate: {},
    workoutMemosByDate: {},     // { 'YYYY-MM-DD': '感想テキスト' }
    workoutCompletedDates: {},  // { 'YYYY-MM-DD': true }

    savedTimerPresets: JSON.parse(JSON.stringify(DEFAULT_TIMER_PRESETS)),

    activeExIndex: 0,
    activeSetIndex: 0,
    inputMode: 'weight', // 'weight' or 'reps'
    inputWeight: '80.0',
    inputReps: '8',
    isFreshInput: true,

    timer: {
        workSec: DEFAULT_TIMER_WORK_SEC,
        restSec: DEFAULT_TIMER_REST_SEC,
        totalSets: DEFAULT_TIMER_TOTAL_SETS,

        currentSet: 1,
        phase: 'WORK', // 'WORK' | 'REST' | 'COMPLETE'
        seconds: DEFAULT_TIMER_WORK_SEC,
        totalSeconds: DEFAULT_TIMER_WORK_SEC,
        interval: null,
        active: false
    },

    audioCtx: null,
    chartMetric: 'weight',
    currentFilterPart: 'ALL'
};
