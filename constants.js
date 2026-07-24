// ============================================================================
// constants.js
// アプリ全体で使う定数・初期データを一箇所に集約。
// 「命名規則の統一」「マジックナンバー排除」のためのモジュール。
// 値を変えたいときはここだけを触ればよい。
// ============================================================================

// LocalStorage に保存する際のキー。将来 Firebase 等へ移行する際も
// このキー名をそのままコレクション/ドキュメントIDの手がかりに使える。
export const STORAGE_KEY = 'iron_log_state';

// アプリのバージョン表記（設定画面に表示）
export const APP_VERSION = 'Ver 1.2.0';

// 画面(View)の識別子一覧。ナビゲーションと表示切替はすべてこの配列を基準に動く。
export const VIEW_NAMES = ['calendar', 'workout', 'timer', 'analytics', 'settings'];

// 種目の部位カテゴリ（フィルタボタンの並び順もこれに準拠）
export const EXERCISE_PARTS = ['胸', '背中', '脚', '肩', '腕', '腹筋'];

// 種目登録フォームのデフォルト部位
export const DEFAULT_EXERCISE_PART = '胸';

// 新規セット追加時のデフォルト値（前セットが存在しない場合のフォールバック）
export const DEFAULT_SET_WEIGHT = 60;
export const DEFAULT_SET_REPS = 10;
export const DEFAULT_SET_COUNT = 3;

// テンキーが受け付ける最大文字数（重量/回数の入力欄）
export const MAX_INPUT_LENGTH = 6;

// プレート刻み幅（+2.5 / -2.5 ボタン）
export const WEIGHT_STEP = 2.5;

// トースト通知の表示時間 (ms)
export const TOAST_DURATION_MS = 2500;

// 1RM推定式（Epley式）の係数。 est1RM = weight * (1 + reps / EPLEY_DIVISOR)
export const EPLEY_DIVISOR = 30;

// インターバルタイマーの残り秒数がこの値になったらビープ音を鳴らす
export const BEEP_COUNTDOWN_SECONDS = [3, 2, 1];

// 初期状態でユーザーに提供するマスター種目データ
export const DEFAULT_MASTER_EXERCISES = [
    { id: 'ex1', name: 'ベンチプレス', part: '胸', bodyweightPct: 0, youtubeUrl: 'https://www.youtube.com/watch?v=vthMCtgVtFw' },
    { id: 'ex2', name: 'インクラインダンベルプレス', part: '胸', bodyweightPct: 0, youtubeUrl: '' },
    { id: 'ex3', name: 'スクワット', part: '脚', bodyweightPct: 0, youtubeUrl: '' },
    { id: 'ex4', name: '懸垂 (チンニング)', part: '背中', bodyweightPct: 95, youtubeUrl: '' },
    { id: 'ex5', name: 'ショルダープレス', part: '肩', bodyweightPct: 0, youtubeUrl: '' },
    { id: 'ex6', name: 'アームカール', part: '腕', bodyweightPct: 0, youtubeUrl: '' },
    { id: 'ex7', name: 'クランチ', part: '腹筋', bodyweightPct: 0, youtubeUrl: '' },
    { id: 'ex8', name: 'アブローラー', part: '腹筋', bodyweightPct: 0, youtubeUrl: '' }
];

// 初期状態で用意するタイマープリセット
export const DEFAULT_TIMER_PRESETS = [
    { id: 'p1', name: '標準インターバル', workSec: 60, restSec: 30, sets: 3 },
    { id: 'p2', name: 'HIIT (30秒/15秒)', workSec: 30, restSec: 15, sets: 8 }
];

// タイマーのデフォルト設定値
export const DEFAULT_TIMER_WORK_SEC = 30;
export const DEFAULT_TIMER_REST_SEC = 15;
export const DEFAULT_TIMER_TOTAL_SETS = 4;

// 新規追加日にサンプルとして生成する初期ワークアウト（初回体験用）
export const SAMPLE_INITIAL_WORKOUT = [
    {
        name: 'ベンチプレス',
        part: '胸',
        sets: [
            { setNum: 1, weight: 80.0, reps: 8, completed: false },
            { setNum: 2, weight: 80.0, reps: 8, completed: false },
            { setNum: 3, weight: 80.0, reps: 7, completed: false }
        ]
    }
];
