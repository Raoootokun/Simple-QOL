import { world, system, Player, ItemStack, Block, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";
import { config } from "../config";

export class AutoTool {
    
    /**
     * ツールの持ち替えを行います
     * @param {Player} player 
     * @param {Block} block 
     * @returns 
     */
    static run(player, block) {
        //プレイヤーかどうか
        if(!Util.isPlyaer(player))return;
        //自動持ち替えがONになっているか
        if(!AutoTool.get(player))return;

        const itemStack = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);
        //武器(剣、槍、トライデント)の場合はなし
        if(AutoTool.isWeapon(itemStack))return;

        const itemToolType = AutoTool.getToolType(itemStack);
        const blockToolType = AutoTool.getToolType(block);

        //ツールが適正かどうか
        if(blockToolType == itemToolType)return;
        
        AutoTool.setTool(player, blockToolType)
    };


    /**
     * アイテムorブロックのツールタイプを取得
     * @param {{}} arg 
     * @returns {string | undefined}
     */
    static getToolType(arg) {
        if(arg instanceof ItemStack) { //アイテムの場合
            if(arg.typeId.includes("sword"))return "sword";
            else if(arg.typeId.includes("pickaxe"))return "pickaxe";
            else if(arg.typeId.includes("axe"))return "axe";
            else if(arg.typeId.includes("shovel"))return "shovel";
            else if(arg.typeId.includes("hoe"))return "hoe";
            else return undefined;
        }else if(arg instanceof Block) { //ブロックの場合
            const type = arg.getTags().find(tag => { if(tag.includes("item_destructible"))return tag; });
            if(type)return type.replace("minecraft:is_", "").replace("_item_destructible", "");
            else return undefined;
        }

    }


    /**
     * 持ち替えを行います
     * @param {Player} player 
     * @param {string} blockToolType 
     * @returns 
     */
    static setTool(player, blockToolType) {
        const container = player.getComponent("inventory").container;

        //ホットバーを検索
        for(let i=0; i<9; i++) {
            const itemStack = container.getItem(i);
            if(!itemStack)continue;

            const itemToolType = AutoTool.getToolType(itemStack);
            if(!itemToolType)continue;

            //適正ツールを発見
            if(itemToolType == blockToolType) {
                return player.selectedSlotIndex = i;
            }
        }

        //インベントリを検索
        for(let i=9; i<container.size; i++) {
            const itemStack = container.getItem(i);
            if(!itemStack)continue;

            const itemToolType = AutoTool.getToolType(itemStack);
            if(!itemToolType)continue;
            
            //適正ツールを発見
            if(itemToolType == blockToolType) {
                const oldItemStack = container.getItem(player.selectedSlotIndex);
                const newItemStack = itemStack;

                container.setItem(i, oldItemStack);
                container.setItem(player.selectedSlotIndex, newItemStack);
                
                return;
            }
        }
    }

    /**
     * 
     * @param {ItemStack} itemStack 
     * @returns 
     */
    static isWeapon(itemStack) {
        return config.no_autotool_item.includes(itemStack?.typeId);
    }



    static get(player) {
        return playerDB.get(player, "autoTool") ?? true;
    }

    /**
     * 自動持ち替えの設定を行います
     * @param {Player} player 
     * @param {boolean} bool 
     * @param {boolean} isAnnounce 
     * @returns 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§f自動持ち替え: §f${QOL_Util.getBoolText(AutoTool.get(player))}`);

        if(isAnnounce)player.sendMessage(`§f自動持ち替えを §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "autoTool", bool);
    }
}