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
        { title: "🏆 Daily Ranking", message: "タブデストロイヤー 終了のお知らせ、ランキングはコチラです" },
        { title: "💀 Survival Report", message: "今日の生存者（タブクリーン達成者）の集計が終わりました。" }
    ],
    // Cleanup Action
    cleanup: [
        { title: "✨ Purified", message: "{count}個のタブが昇天しました。徳(Karma)が高まりました。" },
        { title: "🗑️ Eliminated", message: "{count}個のタブを排除しました。スッキリしましたね。" }
    ],
    // Zero/Clean State
    clean: [
        { title: "✨ Pristine", message: "すばらしい！閉じるべきタブは一つもありません。その調子です！" },
        { title: "🧘 Zen Mode", message: "タブ・ゼロ、思考・クリア。悟りを開いていますね。" }
    ]
};

/**
 * Returns a random flavor text for the given type.
 * @param {string} type 'warn', 'close', 'ranking', 'cleanup', or 'clean'
 * @param {object} params replacement parameters (e.g., {count: 5})
 */
export function getNotificationContent(type, params = {}) {
    const options = FLAVOR_TEXTS[type] || FLAVOR_TEXTS['warn'];
    const choice = options[Math.floor(Math.random() * options.length)];

    let message = choice.message;

    // Specific override for Ranking if requested (though handled by random above, 
    // if exact match needed we can force it, but user gave it as an example/flavor)
    // Let's ensure the user's specific text is likely to appear or is one of the choices.
    // The user said: 22時の通知は「タブデストロイヤー 終了のお知らせ、ランキングはコチラです」
    // I added it to the array.

    // Replace params
    Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
    });

    return {
        title: choice.title,
        message: message
    };
}
