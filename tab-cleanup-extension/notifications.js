/**
 * notifications.js
 * Manages flavor text for notifications to keep them engaging but minimal.
 */

const FLAVOR_TEXTS = {
    // 18:00 Warning
    warn: [
        { title: "⏰ 18:00 - Elimination Time", message: "みなさん18時です！タブを消し去る時間がやってきました！\n(Death Game Style)" },
        { title: "😇 Tab Cleanup Time", message: "お仕事お疲れ様です。そろそろブラウザも整理して、心を軽くしませんか？" },
        { title: "🔥 Burn the Tabs", message: "タブが多すぎます。Fever Timeに備えて断捨離しましょう！" }
    ],
    // 21:00 Close Time
    close: [
        { title: "🚪 21:00 - The End", message: "今日のブラウジングは終了です。全てのタブが記録され、消滅します..." },
        { title: "🌙 Good Night Tabs", message: "今日一日分のタブを思い出として保存しました。ゆっくり休んでくださいね。" }
    ],
    // 22:00 Ranking
    ranking: [
        { title: "🏆 Daily Ranking", message: "本日の「断捨離ランキング」集計完了！あなたの順位は...？" },
        { title: "💀 Survival Report", message: "今日の生存者（タブクリーン達成者）の集計が終わりました。" }
    ],
    // Cleanup Action
    cleanup: [
        { title: "✨ Purified", message: "{count}個のタブが昇天しました。徳(Karma)が高まりました。" },
        { title: "🗑️ Eliminated", message: "{count}個のタブを排除しました。スッキリしましたね。" }
    ]
};

/**
 * Returns a random flavor text for the given type.
 * @param {string} type 'warn', 'close', 'ranking', or 'cleanup'
 * @param {object} params replacement parameters (e.g., {count: 5})
 */
export function getNotificationContent(type, params = {}) {
    const options = FLAVOR_TEXTS[type] || FLAVOR_TEXTS['warn'];
    const choice = options[Math.floor(Math.random() * options.length)];

    let message = choice.message;
    // Replace params
    Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
    });

    return {
        title: choice.title,
        message: message
    };
}
