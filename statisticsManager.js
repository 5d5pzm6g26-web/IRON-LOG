// ============================================================================
// StatisticsManager
// 「成長分析」画面のロジック。Chart.js を使った推移グラフと、
// 自己ベスト(PR)表示を担当する。
// ============================================================================

import { appState } from './state.js';
import { qs, toFloatSafe, round1 } from './utils.js';
import { EPLEY_DIVISOR } from './constants.js';
import { calculateSetVolume } from './workoutManager.js';

let chartInstance = null;

/** 種目選択プルダウンの選択肢を、記録済み種目＋マスター種目からユニークに構成する */
export function populateChartExerciseOptions() {
    const select = qs('chart-exercise-select');
    if (!select) return;

    const existingNames = new Set();
    Object.values(appState.workoutLogsByDate).forEach(logs => {
        logs.forEach(ex => existingNames.add(ex.name));
    });
    appState.masterExercises.forEach(m => existingNames.add(m.name));

    select.innerHTML = '';
    existingNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        select.appendChild(opt);
    });
}

/** グラフの指標(重量/総量/推定1RM/回数)を切り替える */
export function setChartMetric(metric) {
    appState.chartMetric = metric;

    ['weight', 'volume', '1rm', 'reps'].forEach(m => {
        const btn = qs(`m-${m}`);
        if (btn) {
            btn.className = (m === metric)
                ? 'py-1.5 rounded-lg bg-brand-500 text-white'
                : 'py-1.5 rounded-lg text-slate-400';
        }
    });

    renderChart();
}

/** 選択中の種目・指標に基づいて成長グラフとPRカードを再描画する */
export function renderChart() {
    const select = qs('chart-exercise-select');
    if (!select) return;
    const selectedExName = select.value;

    const dates = Object.keys(appState.workoutLogsByDate).sort();
    const labels = [];
    const dataValues = [];

    let prMaxWeight = 0;
    let prMax1RM = 0;

    dates.forEach(dStr => {
        const logs = appState.workoutLogsByDate[dStr];
        const matchingEx = logs.find(ex => ex.name === selectedExName);

        if (matchingEx && matchingEx.sets.length > 0) {
            let maxWeight = 0;
            let totalVolume = 0;
            let max1RM = 0;
            let totalReps = 0;

            matchingEx.sets.forEach(s => {
                const w = toFloatSafe(s.weight, 0);
                const r = toFloatSafe(s.reps, 0);
                const vol = calculateSetVolume(selectedExName, w, r);

                totalVolume += vol;
                totalReps += r;
                if (w > maxWeight) maxWeight = w;

                // Epley式による推定1RM
                const est1RM = w * (1 + r / EPLEY_DIVISOR);
                if (est1RM > max1RM) max1RM = est1RM;
            });

            if (maxWeight > prMaxWeight) prMaxWeight = maxWeight;
            if (max1RM > prMax1RM) prMax1RM = max1RM;

            labels.push(dStr.slice(5));

            if (appState.chartMetric === 'weight') dataValues.push(maxWeight);
            else if (appState.chartMetric === 'volume') dataValues.push(Math.round(totalVolume));
            else if (appState.chartMetric === '1rm') dataValues.push(round1(max1RM));
            else if (appState.chartMetric === 'reps') dataValues.push(totalReps);
        }
    });

    const prWeightEl = qs('pr-max-weight');
    const pr1RMEl = qs('pr-max-1rm');
    if (prWeightEl) prWeightEl.innerHTML = `${prMaxWeight.toFixed(1)} <span class="text-xs font-normal text-slate-400">kg</span>`;
    if (pr1RMEl) pr1RMEl.innerHTML = `${prMax1RM.toFixed(1)} <span class="text-xs font-normal text-slate-400">kg</span>`;

    const ctx = qs('growthChart');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['データなし'],
            datasets: [{
                label: selectedExName,
                data: dataValues.length > 0 ? dataValues : [0],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#f97316',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } }
            }
        }
    });
}
