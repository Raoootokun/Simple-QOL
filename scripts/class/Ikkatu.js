import { world, system, ItemStack, Player, Block, LootTableManager, Dimension } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { Vector } from "../lib/Vector";
import { ModalFormData } from "@minecraft/server-ui";
import { QOL_Util } from "./QOL_Util";
import { Score } from "./Score";


export class Ikkatu {
    constructor(player, itemStack, block) {
        /** @type {Player} */ this.player = player;
        /** @type {ItemStack} */ this.itemStack = itemStack;
        /** @type {Block} */ this.block = block;
        /** @type {Dimension} */ this.dimension = player.dimension;
        /** @type {{}} */ this.data = Ikkatu.getData(player);

        this.count = 0;
        this.maxCount = this.data.maxCount;
    }

    run() {
        //素手の場合
        if(!this.itemStack)return;

        //タイプを取得
        let type;
        if(this.itemStack.typeId.includes("_pickaxe"))type = "mineall";
        else if(this.itemStack.typeId.includes("_axe"))type = "cutall";
        if(!type)return;

        //マインオールの場合
        if(type == "mineall" && (!this.block.typeId.includes("_ore") || !Ikkatu.getActive(this.player, "mineall")))return;
        //カットオールの場合
        if(type == "cutall" && (!this.block.typeId.includes("_log") || !Ikkatu.getActive(this.player, "cutall")))return;
       
        const blockId = this.block.typeId;
        system.run(() => {
            system.runJob(this.searchBlocks(blockId, this.block.location));
        });
    }

    *searchBlocks(blockId, centerPos) {
        const arr = [];

        for(let x=-1; x<=1; x++) {
            for(let y=-1; y<=1; y++) {
                for(let z=-1; z<=1; z++) {
                    const pos = Vector.add(centerPos, { x, y, z });
                    if(pos.y < -64 || pos.y > 320)continue;

                    //ブロックを取得
                    const block = this.dimension.getBlock(pos);
                    //IDが同じかどうか
                    if(block?.typeId == blockId)arr.push(block);

                    yield;
                }
            }
        }

        for(const block of arr) {
            if(this.count >= this.maxCount)return;
            this.count++;

            //アイテムを取得
            const itemStacks = world.getLootTableManager().generateLootFromBlock(block, this.itemStack);
            
            Score.runBreakBlock(this.player, block);

            //ブロックを削除
            block.setType("air");

            

            for(const itemStack of itemStacks) {
                //自動回収
                if(this.data.autoCollect) {
                    const container = this.player.getComponent("inventory").container;
                    const noSendItemStack = container.addItem(itemStack);
                    //送れなかったアイテムは足元にドロップ
                    if(noSendItemStack) {
                        const dropItem = this.dimension.spawnItem(noSendItemStack, this.player.location);
                        dropItem.clearVelocity();
                    }
                }else {
                    const dropItem = this.dimension.spawnItem(itemStack, block.location);

                    //静的ドロップかどうか
                    if(this.data.staticDrop)dropItem.clearVelocity();
                }
                

                system.runJob(this.searchBlocks(blockId, block.location));
                yield;
            }
        }
    }




    /**
     * カットール、マインオールを設定します
     * @param {Player} player 
     * @param {string} type 
     * @param {boolean} bool 
     * @param {boolean} isAnnounce 
     */
    static set(player, type, bool, isAnnounce = true) {
        const typeText = Ikkatu.getTypeText(type);
        if(bool == undefined)return player.sendMessage(`§f${typeText}: ${QOL_Util.getBoolText(Ikkatu.get(player, type))}`);

        //activeのほうもOFFにする
        if(!bool)Ikkatu.setActive(player, type, false);

        if(isAnnounce)player.sendMessage(`§f${typeText}を ${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, type, bool);
    }

    /**
     * カットール、マインオールがONになっているか
     * @param {Player} player 
     * @param {string} type 
     * @returns {boolean}
     */
    static get(player, type) {
        return playerDB.get(player, type) ?? true;
    }

    /**
     * 設定フォームを表示します
     * @param {Player} player 
     */
    static showSettingForm(player) {
        //スニーク中か
        if(!player.isSneaking)return;

        const itemStack = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);
        if(!itemStack)return;
        if(!itemStack.typeId.includes("_pickaxe") && !itemStack.typeId.includes("_axe"))return;

        player.isShowForm = true;

        const data = Ikkatu.getData(player);

        const form = new ModalFormData();
        form.title(`一括破壊`)
        form.slider("最大連鎖数", 100, 500, { valueStep:25, defaultValue:data.maxCount, tooltip:"連鎖するブロック数を設定します\nスペックによって重たくなる可能性があります" })
        form.toggle("アイテム静的ドロップ", { defaultValue:data.staticDrop, tooltip:"アイテムがブロックの中心座標にドロップします" })
        form.toggle("アイテム自動回収", { defaultValue:data.autoCollect, tooltip:"ドロップ時にアイテムをインベントリに移動します" })
        form.submitButton("保存")
        form.show(player).then(res => {
            if(res.canceled)return delete player.isShowForm;

            playerDB.set(player, "ikkatu_data", {
                maxCount: res.formValues[0],
                staticDrop: res.formValues[1],
                autoCollect: res.formValues[2]
            });
            player.sendMessage(`§f一括破壊の設定を保存しました`);

            delete player.isShowForm;
        });
    }

    /**
     * 
     * @param {Player} player 
     */
    static change(player) {
        if(player.isShowForm)return;

        const itemStack = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);
        if(!itemStack)return;

        let type;
        if(itemStack.typeId.includes("_pickaxe"))type = "mineall";
        else if(itemStack.typeId.includes("_axe"))type = "cutall";
        if(!type)return;

        if(type == "mineall" && !Ikkatu.get(player, "mineall"))return;
        if(type == "cutall" && !Ikkatu.get(player, "cutall"))return;

        const typeText = Ikkatu.getTypeText(type);
        const isActive = Ikkatu.getActive(player, type);

        player.sendMessage(`§f${typeText}切り替え: ${QOL_Util.getBoolText(!isActive)}`);
        player.playSound("random.click");
        Ikkatu.setActive(player, type, !isActive);
    }

    static setActive(player, type, bool) {
        playerDB.set(player, `${type}_actrive`, bool);
    }

    static getActive(player, type) {
        return playerDB.get(player, `${type}_actrive`) ?? false;
    }


    static getTypeText(type) {
        if(type == "cutall")return "カットオール";
        else if(type == "mineall")return "マインオール";
    }

    static getData(player) {
        return playerDB.get(player, "ikkatu_data") ?? {
            maxCount: 300,
            staticDrop: false,
            autoCollect: false
        };
    }
}