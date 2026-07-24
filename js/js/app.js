import { DataManager } from './core/DataManager.js';
import { WorkoutManager } from './managers/WorkoutManager.js';
import { UIManager } from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. データ管理層の初期化
    const dataManager = new DataManager();
    
    // 2. ビジネスロジック層の初期化（他のManagerが増えたらここに追加）
    const managers = {
        workout: new WorkoutManager(dataManager)
    };

    // 3. UI管理層の初期化
    const uiManager = new UIManager(managers);
    
    // 4. アプリ起動時の初期画面を設定
    uiManager.switchView('calendar');
});
