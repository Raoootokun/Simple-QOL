import { world, system, Player, Entity, Block, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";


export class DynamicLight {
    static lightLevel = 10;

    /**
     * 
     * @param {Player} player 
     * @returns 
     */
    static run(player) {
        //前回の光源を取得
        const oldPos = DynamicLight.getPos(player);
        if(oldPos) {
            const oldblock = player.dimension.getBlock(oldPos);
            if(oldblock?.typeId.includes(`light_block_`)) {
                oldblock.setType("air");
                DynamicLight.savePos(player, undefined);
            }
        };

        if(!DynamicLight.get(player))return;

        const itemStack = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);
        if(itemStack?.typeId != "minecraft:torch")return;

        const pos = Vector.round(player.location);

        const block = player.dimension.getBlock(pos);
        //設置不可の場合
        if(!DynamicLight.checkBlock(block))return;

        //座標を保存
        DynamicLight.savePos(player, pos);

        //光源を設置    
        block.setType(`minecraft:light_block_${DynamicLight.lightLevel}`);
    }


    /**
     * 座標、空気かどうか、読み込まれているかどうかを判別
     * @param {Block} block 
     * @returns {boolean}
     */
    static checkBlock(block) {
        if(!block)return false;
        if(!block.isAir)return false
        if(block.y > 320 || block.y < -64)return false;

        return true;
    }

    static savePos(player, pos) {
        playerDB.set(player, "dynamicLightPos", pos);
    }

    static getPos(player) {
        return playerDB.get(player, "dynamicLightPos");
    }



    /**
     * @param {Player} player 
     * @param {boolean} bool
     * @param {boolean} isAnnounce
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§fダイナミックライト: §f${QOL_Util.getBoolText(DynamicLight.get(player))}`);

        if(isAnnounce)player.sendMessage(`§fダイナミックライトを §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "dynamicLight", bool);
    }

    /**
     * @param {Player} player 
     * @returns {boolean}
     */
    static get(player) {
        return playerDB.get(player, "dynamicLight") ?? false;
    }
}