import { world, system, } from "@minecraft/server";

const loadStartTick = system.currentTick;

// コールバックを格納する集合（複数登録を安全に扱う）
const worldLoadCallbacks = new Set();

export class WorldLoad {
    /**
     * コールバックを登録する（静的メソッド）
     * @param {( data:{ loadStartTick: number, loadTick: number }) => void} callback - ワールドロード時に呼ばれる関数
     */
    static subscribe(callback) {
        worldLoadCallbacks.add(callback);
    }

    // コールバックを解除する（静的メソッド）
    static unsubscribe(callback) {
        worldLoadCallbacks.delete(callback);
    }
}

// 定期実行を開始（system.runIntervalは環境依存のAPIを想定）
const systemNum = system.runInterval(() => {
    // プレイヤーが1人でもワールドに参加したら発火
    if (world.getPlayers().length > 0) {
        // 定期実行を停止（もうチェックする必要がないため）
        system.clearRun(systemNum);

        // 登録されたすべてのコールバックを呼ぶ
        for (const cb of worldLoadCallbacks) {
            try {
                cb({ 
                    loadStartTick: loadStartTick,
                    loadTick: system.currentTick 
                });
            } catch (e) {
                // 個別コールバックの例外が全体に影響しないように保護
                console.error('WorldLoad callback error:', e);
            }
        }
    }
});