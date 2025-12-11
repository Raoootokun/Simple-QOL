import { world, system, Player, Entity, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";


export class QuickDrop {

    /**
     * 
     * @param {Player} player 
     * @param {Entity} entity 
     * @returns 
     */
    static run(player, entity) {
        if(!Util.isPlyaer(player))return;
        if(!QuickDrop.get(player))return;

        //トロッコorボートかどうか
        if(entity.typeId.includes("boat") || entity.typeId.includes("minecart")) {
            entity.applyDamage(10000);
        }
    }

    /**
     * @param {Player} player 
     * @param {boolean} bool
     * @param {string} isAnnounce 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§fクイックドロップ: §f${QOL_Util.getBoolText(QuickDrop.get(player))}`);

        if(isAnnounce)player.sendMessage(`§fクイックドロップを §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "quickDrop", bool);
    }

    /**
     * @param {Player} player 
     * @returns {boolean}
     */
    static get(player) {
        return playerDB.get(player, "quickDrop") ?? true;
    }
}