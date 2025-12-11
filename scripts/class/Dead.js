import { world, system, ItemStack, Player, Entity, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { QOL_Util } from "./QOL_Util";
import { deadDB} from "../database";
import { Vector } from "../lib/Vector";

export class Dead {
    constructor(player, damagingEntity, cause) {
        /** @type {Player} */ this.player = player;
        /** @type {Entity} */ this.damagingEntity = damagingEntity;
        /** @type {string} */ this.cause = cause;
    }

    run() {
        //プレイヤー以外は除外
        if(!Util.isPlyaer(this.player))return;

        const pos = this.player.location;
        const dateInfo = QOL_Util.getDateInfo();

        //チャットに死亡情報を表示
        const txt = `§7死亡情報: §c${pos.x.toFixed(1)}§7, §a${pos.y.toFixed(1)}§7, §b${pos.z.toFixed(1)}§7, (§7${this.player.dimension.id.replace("minecraft:", "")}, ${dateInfo.time})`;
        world.sendMessage(txt);


        //データベースに保存
        this.save(dateInfo);
    }





    save(dateInfo) {
        const list = deadDB.get(this.player, "list") ?? {};

        const id = QOL_Util.createId(5);
        
        //追加
        list[system.currentTick] = {
            pos: this.player.location,
            dimensionId: this.player.dimension.id,
            dateInfo: dateInfo,
            tick: system.currentTick,
            cause: this.cause,
            id: id,
        };

        const keys = Object.keys(list)
            .map(Number)          // 数値に変換
            .sort((a, b) => a - b); // 昇順（小さいほど古い）

        while (keys.length > 10) {
            const oldest = keys.shift(); // 一番古いキーを取り出す
            delete list[oldest];         // そのキーを削除
        }

        deadDB.set(this.player, "list", list);
    }

    /**
     * 死亡座標を取得
     * @param {Player} player 
     * @param {number | undefined} index 
     */
    static showList(player) {
        const list = deadDB.get(player, "list") ?? {};
        const arr = objectToArray(list);

        //死亡情報が無い
        if(arr.length == 0)return player.sendMessage(`§f死亡情報がありません`);

        let txt = `§7--死亡情報一覧--\n§7- [§e経過時間§7]: §cX§7,§aY§7,§bZ§7,§7(§6距離§7)(ディメンション/死因/日時)\n\n`;
        for(let i=0; i<arr.length; i++) {
            txt += `${getText(arr[i], player)}\n`;
        }
        txt += `§7----------`;

        player.sendMessage(txt);
    };


    static get(player) {
        const list = deadDB.get(player, "list") ?? {};
        const arr = objectToArray(list);

        for(let i=0; i<arr.length; i++) {
            arr[i].text = getText(arr[i], player)
        }

        return arr;
    }

    static reset(player, showAnnounce) {
        deadDB.set(player, "list", {});

        if(showAnnounce)player.sendMessage(`§d死亡座標をリセットしました`);
    }


    /**
     * ID(死因)からテキスト(死因)を取得します
     * @param {string} cause
     * @returns {string} 
     */
    static getCauseText(cause) {
        const damageTypes = {
            anvil: "金床",
            blockExplosion: "ブロックの爆発",
            campfire: "焚き火",
            charging: "突進",
            contact: "接触",
            drowning: "溺れ",
            entityAttack: "エンティティ攻撃",
            entityExplosion: "エンティティの爆発",
            fall: "落下",
            fallingBlock: "落下ブロック",
            fire: "火",
            fireTick: "火による継続ダメージ",
            fireworks: "花火",
            flyIntoWall: "壁衝突",
            freezing: "凍結",
            lava: "溶岩",
            lightning: "雷",
            maceSmash: "メイスの叩きつけ",
            magic: "魔法",
            magma: "マグマブロック",
            none: "不明",
            override: "上書きダメージ",
            piston: "ピストン",
            projectile: "飛び道具",
            ramAttack: "体当たり",
            selfDestruct: "自殺",
            sonicBoom: "ソニックブーム",
            soulCampfire: "魂の焚き火",
            stalactite: "つらら（天井側）",
            stalagmite: "石筍（地面側）",
            starve: "餓死",
            suffocation: "窒息",
            temperature: "温度",
            thorns: "棘の反射",
            void: "奈落",
            wither: "衰弱"
        };

        return damageTypes[cause] ?? "不明";
    }

}


/**
 * オブジェクトを配列に変換し、並び替え
 * @param {{}} obje 
 * @returns {[]}
 */
function objectToArray(obje) {
    const arr = [];

    for(const key of Object.keys(obje)) {
        const data = obje[key];
        arr.push(data);
    }

    arr.sort((a, b) => b.tick - a.tick);

    return arr;
}

/**
 * データをテキストの変換
 * @param {{}} data 
 * @param {Player} player 
 * @returns {string}
 */
function getText(data, player) {
    const pos = `§c${data.pos.x.toFixed(1)}§7, §a${data.pos.y.toFixed(1)}§7, §b${data.pos.z.toFixed(1)}§7`;
    const dateInfo = `${data.dateInfo.day}/${data.dateInfo.time}`;
    const dimensionId = `${data.dimensionId.replace("minecraft:", "")}`;
    const cause = `${Dead.getCauseText(data.cause)}`;
    const tick = `${QOL_Util.getTimeStr((system.currentTick - data.tick) / 20)}`;
    const dis = player.dimension.id == data.dimensionId ? `${Vector.distance(player.location, data.pos).toFixed(1)}` : `--`;
    return `§7- [§e${tick}§7]: ${pos} §7(§6${dis}m§7)§7(${dimensionId}§7, ${cause}§7, ${dateInfo})`;
}



