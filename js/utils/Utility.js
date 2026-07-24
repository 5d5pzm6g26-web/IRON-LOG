export class Utility {
    /**
     * 現在の日付を YYYY-MM-DD 形式で取得
     */
    static getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 推定1RMを計算 (Epley formula)
     */
    static calculate1RM(weight, reps) {
        if (reps <= 0) return 0;
        if (reps === 1) return weight;
        return Math.round(weight * (1 + reps / 30));
    }
}
