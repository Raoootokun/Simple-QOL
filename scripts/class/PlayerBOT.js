import { world, system, Player, Entity, ItemStack, } from "@minecraft/server";
import { spawnSimulatedPlayer, getPlayerSkin } from "@minecraft/server-gametest";
import { WorldLoad } from "../lib/WorldLoad";
import { log } from "../lib/Util";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";
import { ActionFormData } from "@minecraft/server-ui";
import { Vector } from "../lib/Vector";

export class PlayerBOT {
    
    /**
     * BOTを召喚
     * @param {Player} player 
     * @returns 
     */
    static spawn(player) {
        const isSpawned = PlayerBOT.getBOT(player);
        if(isSpawned)return player.sendMessage(`§cエラー: すでにBOTを召喚済みです。召喚しているBOTを/removeで削除してください`);

        /** @type {Player} */
        const simuPlayer = spawnSimulatedPlayer(
            { dimension:player.dimension, x:player.location.x, y:player.location.y, z:player.location.z }, 
            `§uBOT-Player§7(${player.name})§e`, 
            "Survival"
        );

        simuPlayer.nameTag = `§uBOT-Player§f\n§7(${player.name})§r`;
        simuPlayer.setSkin(getPlayerSkin(player));

        simuPlayer.addTag("isBOT");
        simuPlayer.setDynamicProperty("parentName", player.name);
        simuPlayer.teleport(player.location);

        playerDB.set(simuPlayer, "sec", 0);

        const itemStack = new ItemStack("stone", 64);
        itemStack.nameTag = `No Data Item`;
        const container = simuPlayer.getComponent("inventory").container;
        for(let i=0; i<container.size; i++) {
            container.setItem(i, itemStack);
        }
    }

    /**
     * BOTを退出
     * @param {Player} simuPlayer 
     * @returns 
     */
    static hurt(simuPlayer) {
        if(!PlayerBOT.isBOT(simuPlayer))return;

        const parent = PlayerBOT.getParent(simuPlayer);
        if(parent)parent.sendMessage(`§uBOT-Player§eが退出しました`);

        simuPlayer.disconnect();
    }

    static disconnect(player) {
        const simuPlayer = PlayerBOT.getBOT(player);
        if(!simuPlayer)return player.sendMessage(`§cエラー: BOTが見つかりません`);

        player.sendMessage(`§uBOT-Player§eを退出させました`);
        simuPlayer.disconnect();
    }

    static teleport(player) {
        const simuPlayer = PlayerBOT.getBOT(player);
        if(!simuPlayer)return player.sendMessage(`§cエラー: BOTが見つかりません`);

        player.playSound("mob.endermen.portal");
        player.sendMessage(`§uBOT-Player§eをテレポートしました`);
        simuPlayer.teleport(player.location);
    }

    /**
     * BOTかどうか
     * @param {Entity} entity 
     */
    static isBOT(entity) {
        return entity.hasTag("isBOT");
    }

    /**
     * 作成したプレイヤーを取得
     * @param {Entity} simuPlayer 
     */
    static getParent(simuPlayer) {
        const parentName = simuPlayer.getDynamicProperty("parentName");
        return world.getPlayers({ name:parentName })[0];
    }

    /**
     * BOTを取得
     * @param {Player} player 
     */
    static getBOT(player) {
        return world.getPlayers({ tags:["isBOT"] }).filter(bot => {
            if(bot.getDynamicProperty("parentName") == player.name)return bot;
        })[0];
    }

    /**
     * BOTを取得
     * @param {Player} simuPlayer 
     */
    static runTick(simuPlayer) {
        if(system.currentTick % 20 != 0)return;

        const sec = playerDB.get(simuPlayer, "sec");
        const time = QOL_Util.getTimeStr(sec);
        playerDB.set(simuPlayer, "sec", sec + 1);

        const parentName = simuPlayer.getDynamicProperty("parentName");

        simuPlayer.nameTag = `§e${time}\n§uBOT-Player§f\n§7(${parentName})§r`;
        simuPlayer.addEffect("resistance", 3600, { amplifier:255, showParticles:false });
    }




    static showForm(player) {
        let txt;
        const bot = PlayerBOT.getBOT(player);

        const form = new ActionFormData();
        form.title(`BOT`);
        if(bot) {
            txt = `BOT: §a稼働中\n\n`;
            txt += `§f座標: §c${bot.location.x.toFixed(1)}§7, §a${bot.location.y.toFixed(1)}§7, §b${bot.location.z.toFixed(1)}§f\n` 
            txt += `§fディメンション: §7${bot.dimension.id}§f\n` 
            txt += `§f稼働時間: §7${QOL_Util.getTimeStr(playerDB.get(bot, "sec"))}§f\n\n` 

            form.body(txt);
            form.button(`BOTをテレポートする`, `textures/items/ender_pearl`);
            form.button(`BOTを切断する`, `textures/ui/cancel`);
        }
        else {
            txt = `BOT: §c停止中\n\n§7現在召喚しているBOTはいません\n\n`;

            form.body(txt);
            form.button(`BOTを召喚する`, `textures/ui/Friend2`);
        }
        form.show(player).then(res => {
            if(res.canceled)return;

            if(bot) {
                if(res.selection == 0)PlayerBOT.teleport(player);
                if(res.selection == 1)PlayerBOT.disconnect(player);
            }else {
                if(res.selection == 0)PlayerBOT.spawn(player);
            }
            
        })
    }
}
 

WorldLoad.subscribe(() => {
    // const a1 = spawn(1, { x:-884, y:66, z:-387 });
    // a1.isSneaking = true;

    // const bP = { x:-882, y:66, z:-387 };
    // a1.lookAtEntity(world.getPlayers({ name:"Raoootokun"})[0])

})