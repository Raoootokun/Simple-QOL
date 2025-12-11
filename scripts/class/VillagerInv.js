import { world, system, ItemStack, Player, Entity, Container, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { ActionFormData } from "@minecraft/server-ui";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";

export class VillagerInv {
    constructor(player, villager) {
        /** @type {Player} */ this.player = player;
        /** @type {Entity} */ this.villager = villager;
        /** @type {Container} */ this.container = villager.getComponent("inventory").container;
    }
  
    /**
     * 
     * @param {{ player:Player, target:Entity, cancel:Boolean }} ev 
     */
    static initRun(ev) {
        const { player, target, itemStack, } = ev;
        if(target.typeId != "minecraft:villager_v2")return;
        if(!player.isSneaking)return;
        if(!VillagerInv.get(player))return;

        ev.cancel = true;

        system.run(() => {
            const vill = new VillagerInv(player, target);
            vill.showMainForm();
        });
    };


    /**
     * インベントリフォームを表示
     */
    showMainForm() {
        const rawtext = { rawtext:[ { text:`インベントリ: \n` } ]};

        for(let i=0; i<this.container.size; i++) {
            const itemStack = this.container.getItem(i);

            if(itemStack) {
                rawtext.rawtext.push({ text:`§7  - ` }, { translate:itemStack.localizationKey }, { text:` §e(${itemStack.amount})\n` });
            }else {
                rawtext.rawtext.push({ text:`§7  - §8---\n` })
            }
        };

        const form = new ActionFormData()
        form.title(`村人`)
        form.body(rawtext);
        form.divider()
        form.button(`アイテムを取り出す`);
        form.button(`アイテムを渡す`);
        form.show(this.player).then(res => {
            if(res.canceled)return;

            if(res.selection == 0)this.showDropItemForm();
            if(res.selection == 1)this.showAddItemForm();
        });
    }


    /**
     * 取り出すアイテム一覧フォームを表示
     */
    showDropItemForm() {
        const list = [];
        for(let i=0; i<this.container.size; i++) {
            const itemStack = this.container.getItem(i);
            if(!itemStack)continue;

            list.push({
                rawtext: { rawtext:[{ text:`§8` }, { translate:itemStack.localizationKey }, { text:` (${itemStack.amount})\n` }] },
                path: VillagerInv.getItemPath(itemStack),
                slot: i
            });
        };


        const form = new ActionFormData()
        form.title(`村人`)
        form.body(`取り出すアイテムを選択してください`);
        for(const data of list) {
            form.button(data.rawtext, data.path);
        }
        form.show(this.player).then(res => {
            if(res.canceled)return;

            const slot = list[res.selection].slot;
            const itemStack = this.container.getItem(slot);

            this.container.setItem(slot);
            
            this.player.playSound("random.pop");
            this.player.sendMessage({ rawtext:[ { text:`§6`}, { translate:itemStack.localizationKey }, { text:` §fを取り出しました` } ]});

            //インベントリに追加
            const container = this.player.getComponent("inventory").container;
            const noSendItemStack = container.addItem(itemStack);

            //インベントリにすべて入らない場合
            if(noSendItemStack?.amount > 0) {
                this.player.dimension.spawnItem(noSendItemStack, this.player.location);
            }
        });
    }

    /**
     * 渡すアイテム一覧フォームを表示
     */
    showAddItemForm() {
        const list = [];

        const container = this.player.getComponent("inventory").container;
        for(let i=0; i<container.size; i++) {
            const itemStack = container.getItem(i);
            if(!itemStack || !VillagerInv.itemIds.includes(itemStack.typeId))continue;

            list.push({
                rawtext: { rawtext:[{ text:`§8` }, { translate:itemStack.localizationKey }, { text:` (${itemStack.amount})\n§0スロット: ${i}` }] },
                path: VillagerInv.getItemPath(itemStack),
                slot: i
            });
        };

        const form = new ActionFormData()
        form.title(`村人`)
        form.body(`渡すアイテムを選択してください`);
        for(const data of list) {
            form.button(data.rawtext, data.path);
        }
        form.show(this.player).then(res => {
            if(res.canceled)return;

            const slot = list[res.selection].slot;
            const itemStack = container.getItem(slot);
            const defAmount = itemStack.amount;

            this.player.playSound("random.pop");
            

            //渡す
            const noSendItemStack = this.container.addItem(itemStack);

            //すべて渡せた場合
            if(!noSendItemStack) {
                container.setItem(slot);
                this.player.sendMessage({ rawtext:[ { text:`§6`}, { translate:itemStack.localizationKey }, { text:` §e(${itemStack.amount})§fを渡しました` } ]});
                return;
            }

            const sendAmount = defAmount - noSendItemStack.amount;

            //すべて渡せなかった
            if(sendAmount == 0) {
                this.player.sendMessage(`§cエラー: インベントリに空きがないためアイテムを渡せません`);
                return;
            }
            if(sendAmount > 0) {
                container.setItem(slot, noSendItemStack);
                this.player.sendMessage({ rawtext:[ { text:`§6`}, { translate:itemStack.localizationKey }, { text:` §e(${sendAmount})§fを渡しました` } ]});
            };
        });
    }



    /**
     * アイテムスタックからテクスチャのパスを取得
     * @param {ItemStack} itemStack 
     * @returns {string}
     */
    static getItemPath(itemStack) {
        const list = {
            "minecraft:potato": "textures/items/potato",
            "minecraft:carrot": "textures/items/carrot",
            "minecraft:bread": "textures/items/bread",
            "minecraft:beetroot": "textures/items/beetroot",

            "minecraft:wheat_seeds": "textures/items/seeds_wheat",
            "minecraft:beetroot_seeds": "textures/items/seeds_beetroot",
            "minecraft:torchflower_seeds": "textures/items/torchflower_seeds",
            "minecraft:pitcher_pod": "textures/items/pitcher_pod",
            "minecraft:bone_meal": "textures/items/dye_powder_white",
        };

        if(list[itemStack.typeId])return list[itemStack.typeId];
        else return "textures/items/bone"
    }

    /**
     * 村人に譲渡可能なアイテムのIDを取得
     * @returns {string[]}
     */
    static get itemIds() {
        return [
            "minecraft:potato",
            "minecraft:carrot",
            "minecraft:bread",
            "minecraft:beetroot",
            "minecraft:wheat_seeds",
            "minecraft:beetroot_seeds",
            "minecraft:torchflower_seeds",
            "minecraft:pitcher_pod",
            "minecraft:bone_meal",
        ];
    }

    /**
     * 
     * @param {Player} player 
     * @param {boolean} bool 
     * @param {boolean} isAnnounce 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§f村人のインベントリ操作: §f${QOL_Util.getBoolText(VillagerInv.get(player))}`);

        if(isAnnounce)player.sendMessage(`§f村人のインベントリ操作を §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "vinv", bool);
    }

    /**
     * @param {Player} player 
     * @returns {boolean}
     */
    static get(player) {
        return playerDB.get(player, "vinv") ?? true;
    }
}