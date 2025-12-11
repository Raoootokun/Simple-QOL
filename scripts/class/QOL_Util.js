import { world, system, ItemStack, Player, Entity, } from "@minecraft/server";
import { log, Util } from "../lib/Util";

export class QOL_Util {

    /**
     * 時刻を取得
     * @returns {{ day:string, time:string }}
     */
    static getDateInfo() {
        const now = new Date();

        // 日本時間（UTC+9）で取得
        const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

        const month = jst.getUTCMonth() + 1;
        const day = jst.getUTCDate();

        const h = String(jst.getUTCHours()).padStart(2, "0");
        const m = String(jst.getUTCMinutes()).padStart(2, "0");
        const s = String(jst.getUTCSeconds()).padStart(2, "0");

        return {
            day: `${month}/${day}`,
            time: `${h}:${m}:${s}`
        };
    }

    /**
     * 秒数を HH:MM:SS 形式の文字列に変換
     * (最大 99:99:99)
     * @param {number} seconds 
     * @returns {string}
     */
    static getTimeStr(seconds, cap = true) {
       seconds = Math.max(0, Math.floor(seconds));

        // 100時間 = 360000秒
        if (cap && seconds >= 360000) {
            return "99:59:59";
        }

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    /**
     * ランダムなIDを生成
     * @param {number} length 
     * @returns {string}
     */
    static createId(length) {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";

        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }

        return result;
    }

    /**
     * valueからゲージを生成
     * @param {number} currentValue 現在値
     * @param {number} maxValue 最大値
     * @param {string} filledText 
     * @param {string} emptyText 
     * @param {number} textLength ゲージの長さ(defaultは10) 
     * @returns {string}
     */
    static createGage(currentValue, maxValue, filledText, emptyText, textLength = 10) {
        // 割合 → 0～10 の整数に丸める
        const filledCount = Math.round((currentValue / maxValue) * textLength);

        let text = "";

        // filled
        for (let i = 0; i < filledCount; i++) {
            text += filledText;
        }

        // empty
        for (let i = 0; i < textLength - filledCount; i++) {
            text += emptyText;
        }

        return text;
    }

    /**
     * bool値を文字列に変換
     * @param {boolean} bool 
     * @returns {string} true|有効, false|無効
     */
    static getBoolText(bool) {
        return bool == true ? "§a有効§f" : "§7無効§f";
    }
}