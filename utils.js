// ============================================================================
// utils.js
// どのマネージャーにも属さない、純粋な汎用関数だけを置く場所。
// DOM の状態や appState には一切触れない（＝どこからでも安全に呼べる）。
// ============================================================================

/** id指定でDOM要素を取得する短縮ヘルパー */
export function qs(id) {
    return document.getElementById(id);
}

/** 今日の日付を YYYY-MM-DD 形式で返す */
export function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/** Dateオブジェクト + year/month から YYYY-MM-DD の日付文字列を組み立てる */
export function buildDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 秒数を MM:SS 形式にフォーマットする */
export function formatSeconds(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** 文字列/未定義値を安全にfloatへ変換し、失敗時はfallbackを返す */
export function toFloatSafe(value, fallback = 0) {
    const n = parseFloat(value);
    return isNaN(n) ? fallback : n;
}

/** 文字列/未定義値を安全にintへ変換し、失敗時はfallbackを返す */
export function toIntSafe(value, fallback = 0) {
    const n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
}

/** 数値を小数第1位で丸める（重量計算などで多用） */
export function round1(value) {
    return Math.round(value * 10) / 10;
}

/** YouTube の様々なURL形式・素のIDから動画IDを抽出する */
export function extractYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}
