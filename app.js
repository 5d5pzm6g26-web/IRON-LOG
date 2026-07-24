// ============================================================================
// app.js
// アプリケーションのエントリーポイント。
//
// このファイルの役割は2つだけ:
//   1. 起動時の初期化 (LocalStorageの読込 → 初期画面の描画)
//   2. HTML側の onclick="関数名(...)" から呼べるよう、各マネージャーの
//      関数を window オブジェクトへ橋渡しする
//
// ロジックそのものは一切ここに書かない。増やしたい機能があれば、
// 対応するマネージャー(WorkoutManager, TimerManager 等)に追加し、
// HTMLから直接呼ぶ必要がある関数だけをここでwindowに追加する。
// ============================================================================

import { loadLocalData } from './dataManager.js';
import { switchView, toggleModal } from './uiManager.js';

import {
    changeMonth,
    selectDate,
    startWorkoutForSelectedDate
} from './calendarManager.js';

import {
    setInputMode,
    hideNumpad,
    pressKey,
    completeCurrentSet,
    updateExerciseName,
    toggleSetComplete,
    deleteSetRow,
    addSetRowToEx,
    deleteExerciseFromWorkout,
    selectActiveSetWithMode,
    openWorkoutMemoModal,
    saveWorkoutMemoAndFinish,
    openCopyDateModal,
    copyWorkoutFromDate,
    openSelectExerciseModal,
    filterMasterExercises,
    addMasterExerciseToCurrentWorkoutByName,
    openYouTubeModal,
    closeYouTubeModal
} from './workoutManager.js';

import {
    updateTimerSettingsFromInputs,
    toggleStandaloneTimer,
    resetStandaloneTimer,
    saveCurrentTimerAsPreset,
    loadCustomTimerPreset,
    deleteCustomTimerPreset,
    openEditPresetModal,
    saveEditedPreset
} from './timerManager.js';

import { setChartMetric, renderChart } from './statisticsManager.js';

import { addNewExercise, saveBodyData, clearAllData } from './settingsManager.js';

// ----------------------------------------------------------------------------
// HTML(inline onclick/onchange)から呼ばれる関数を window に公開する。
// 新しい画面/機能を追加してHTMLから直接呼ぶ関数が増えた場合は、ここに追記する。
// ----------------------------------------------------------------------------
Object.assign(window, {
    // UIManager
    switchView,
    toggleModal,

    // CalendarManager
    changeMonth,
    selectDate,
    startWorkoutForSelectedDate,

    // WorkoutManager
    setInputMode,
    hideNumpad,
    pressKey,
    completeCurrentSet,
    updateExerciseName,
    toggleSetComplete,
    deleteSetRow,
    addSetRowToEx,
    deleteExerciseFromWorkout,
    selectActiveSetWithMode,
    openWorkoutMemoModal,
    saveWorkoutMemoAndFinish,
    openCopyDateModal,
    copyWorkoutFromDate,
    openSelectExerciseModal,
    filterMasterExercises,
    addMasterExerciseToCurrentWorkoutByName,
    openYouTubeModal,
    closeYouTubeModal,

    // TimerManager
    updateTimerSettingsFromInputs,
    toggleStandaloneTimer,
    resetStandaloneTimer,
    saveCurrentTimerAsPreset,
    loadCustomTimerPreset,
    deleteCustomTimerPreset,
    openEditPresetModal,
    saveEditedPreset,

    // StatisticsManager
    setChartMetric,
    renderChart,

    // SettingsManager
    addNewExercise,
    saveBodyData,
    clearAllData
});

// ----------------------------------------------------------------------------
// 起動処理
// ----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    switchView('calendar');
});
