export class DataManager {
    constructor() {
        this.storageKeyPrefix = 'ironlog_';
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.storageKeyPrefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`データの読み込みに失敗しました (${key}):`, error);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(value));
        } catch (error) {
            console.error(`データの保存に失敗しました (${key}):`, error);
        }
    }
}
