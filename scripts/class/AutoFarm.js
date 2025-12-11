import { world, system, Player, ItemStack, Block, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";
import { Item } from "./Item";
import { Score } from "./Score";

export class AutoFarm {
    constructor(player, itemStack, block, ev) {
        /** @type {Player} */ this.player = player;
        /** @type {ItemStack} */ this.itemStack = itemStack;
        /** @type {Block} */ this.block = block;
        /** @type {{}} */ this.ev = ev;
    }

    //作物ブロック
    static get cropIds() {
        return [
            "minecraft:carrots",
            "minecraft:potatoes",
            "minecraft:wheat",
            "minecraft:pumpkin_stem",
            "minecraft:melon_stem",
            "minecraft:beetroot",
            "minecraft:torchflower_crop",
            "minecraft:pitcher_crop",
        ];
    };
 
    run() {
        //自動持ち替えがONになっているか
        if(!AutoFarm.get(this.player))return;

        //作物かどうか
        if(!AutoFarm.cropIds.includes(this.block.typeId))return;

        //アイテムが骨粉か
        if(this.itemStack?.typeId == "minecraft:bone_meal")return;

        //育っているかどうか
        const growth = this.block.permutation.getState("growth");
        if(growth != 7)return;

        if(this.player.isCD)return;
        this.player.isCD = true;

        system.runTimeout(() => {
            delete this.player.isCD;
        }, 1);

        system.run(() => {
            //ドロップアイテムを取得
            const dropArr = world.getLootTableManager().generateLootFromBlock(this.block, this.itemStack);

            //ブロックを削除
            const cropId = this.block.typeId;
            this.block.setType("air");
            this.player.playSound("dig.grass", { volume:0.7, pitch:0.9, });

            //ドロップアイテムに種があるかどうか
            for(let i=0; i<dropArr.length; i++) {
                const dropItemStack = dropArr[i];
                const seedId = AutoFarm.getSeedId(cropId);

                if(seedId == dropItemStack.typeId) { //種がある場合
                    //植える
                    this.block.setType(cropId);
                    //配列から種を削除
                    dropArr.splice(i, 1);

                    Score.runPlaceBlock(this.player, this.block);
                    
                    break;
                }
            };

            //残りのアイテムはインベントリに入れる
            const container = this.player.getComponent("inventory").container;
            for(let i=0; i<dropArr.length; i++) {
                const dropItemStack = dropArr[i];
                Item.setLore(dropItemStack);

                const noSendItemStack = container.addItem(dropItemStack);
                //インベントリに入らなかった分はドロップ
                if(noSendItemStack) {
                    this.block.dimension.spawnItem(noSendItemStack, this.block.location);
                }
            };
        })

        
    };


    /**
     * 作物ブロックから種(アイテムID)を周夫￥得
     * @param {string} cropId 
     * @returns {string}
     */
    static getSeedId(cropId) {
        const list = {
            "minecraft:carrots": "minecraft:carrot",
            "minecraft:potatoes": "minecraft:potato",
            "minecraft:wheat": "minecraft:wheat_seeds",
            "minecraft:pumpkin_stem": "minecraft:pumpkin_seeds",
            "minecraft:melon_stem": "minecraft:melon_seeds",
            "minecraft:beetroot": "minecraft:beetroot_seeds",
            "minecraft:torchflower_crop": "minecraft:torchflower_seeds",
            "minecraft:pitcher_crop": "minecraft:pitcher_pod",
        };

        return list[cropId];
    }


    /**
     * 自動回収の設定を行います
     * @param {Player} player 
     * @param {boolean} bool 
     * @param {boolean} isAnnounce 
     * @returns 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§f自動植え付け: ${QOL_Util.getBoolText(AutoFarm.get(player))}`);

        if(isAnnounce)player.sendMessage(`§f自動植え付けを §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "autoFarm", bool);
    }

    static get(player) {
        return playerDB.get(player, "autoFarm") ?? true;
    }
}