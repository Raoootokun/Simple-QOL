import { world, system, ItemStack, Player, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { ModalFormData } from "@minecraft/server-ui";
import { Item } from "./Item";
import { PlayerBOT } from "./PlayerBOT";

export class Transfer {
    
    /**
     * レベルを他プレイヤーに転送します
     * @param {Player} player 
     * @param {number} level 
     * @param {Player} target 
     */
    static level(player, level, target) {
        //レベルをチェック
        if(level <= 0)return player.sendMessage(`§cエラー: レベルが小さすぎます( > ${level} )`);
        if(level > 50000)return player.sendMessage(`§cエラー: レベルが大きすぎます( > ${level} )`);
        if(player.level < level)return player.sendMessage(`§cエラー: レベルが足りません( > ${level} ). あなたのレベル( > ${player.level})`);

        //送信先が入力されている場合
        if(target) {
            //送信先が自分の場合
            if(target.id == player.id)return player.sendMessage(`§cエラー: 自分にレベルを送信することはできません`);
            if(PlayerBOT.isBOT(target))return player.sendMessage(`§cエラー: BOTにレベルを送信することはできません`);
            return Transfer.tryLevelSend(player, target, level);
        };
    
        const targets = world.getPlayers({ excludeNames:[ player.name ], excludeTags:[ "isBOT" ] });
        if(targets.length == 0)return player.sendMessage(`§cエラー: プレイヤーが見つかりません`);

        const form = new ModalFormData();
        form.title(`レベル送信`);
        form.dropdown(`送信するプレイヤーを選択してください`, targets.map(p => { return p.name; }));
        form.show(player).then(res => {
            if(res.canceled)return;

            target = targets[res.formValues[0]];
            Transfer.tryLevelSend(player, target, level);
        });
    }

    /**
     * レベルを送信
     * @param {Player} player 
     * @param {Player} target 
     * @param {number} level 
     * @returns 
     */
    static tryLevelSend(player, target, level) {
        player.addLevels(-level);
        player.sendMessage(`§7${target.name} §fに §6レベル(§f${level}§6) §fを送信しました`);
        player.playSound("random.orb", { pitch:1.2 });

        target.addLevels(level);
        target.sendMessage(`§7${player.name} §fから §6レベル(§f${level}§6) §fを受け取りました`);
        target.playSound("random.orb", { pitch:1.2 });
    }




    /**
     * アイテムを他プレイヤーに転送します
     * @param {Player} player 
     * @param {Player} target 
     */
    static item(player, target) {
        const itemStack = player.getComponent("inventory").container.getItem(player.selectedSlotIndex);
        if(!itemStack)return player.sendMessage(`§cエラー: メインハンドのアイテムを取得できません`);
    
        //送信先が入力されている場合
        if(target) {
            //送信先が自分の場合
            if(target.id == player.id)return player.sendMessage(`§cエラー: 自分にアイテムを送信することはできません`);
            if(PlayerBOT.isBOT(target))return player.sendMessage(`§cエラー: BOTにアイテムを送信することはできません`);
            return Transfer.tryItemSend(player, target, itemStack);
        };

        const targets = world.getPlayers({ excludeNames:[ player.name ], excludeTags:[ "isBOT" ] });
        if(targets.length == 0)return player.sendMessage(`§cエラー: プレイヤーが見つかりません`);

        const form = new ModalFormData();
        form.title(`レベル送信`);
        form.dropdown(`送信するプレイヤーを選択してください`, targets.map(p => { return p.name; }));
        form.show(player).then(res => {
            if(res.canceled)return;

            target = targets[res.formValues[0]];
            Transfer.tryItemSend(player, target, itemStack);
        });
    }
    
    /**
     * アイテムを送信
     * @param {Player} player 
     * @param {Player} target 
     * @param {ItemStack} itemStack 
     * @returns 
     */
    static tryItemSend(player, target, itemStack) {
        const senderContainer = player.getComponent("inventory").container;
        const targetContainer = target.getComponent("inventory").container;
        const defAmount = itemStack.amount;
        const itemName = Item.getName(itemStack);

        const noSendItemStack = targetContainer.addItem(itemStack);

        //undefinedの場合、送信完了
        if(!noSendItemStack) {
            //アイテム削除
            senderContainer.setItem(player.selectedSlotIndex);

            player.sendMessage({ rawtext:[ { text:`§7${target.name} §fに §6` }, { translate:itemName }, { text:`(§f${defAmount}§6) §fを送信しました` } ] });
            player.playSound("random.orb", { pitch:1.2 });
            target.sendMessage({ rawtext:[ { text:`§7${player.name} §fから §6` }, { translate:itemName }, { text:`(§f${defAmount}§6) §fを受け取りました` } ] });
            target.playSound("random.orb", { pitch:1.2 });

            return;
        }

        //送信できなかったアイテム
        const sendAmount = defAmount - noSendItemStack.amount;
        const nonSendAmount = noSendItemStack.amount;

        //ひとつもアイテムを送信できなかった
        if(sendAmount == 0) {
            player.sendMessage(`§cエラー: ${target.name} §cのインベントリに空きがないためアイテムを送信できません`);
            return;
        }else { //何個か送信できた場合
            senderContainer.setItem(player.selectedSlotIndex, noSendItemStack);

            player.sendMessage({ rawtext:[ { text:`§7${target.name} §fに §6` }, { translate:itemName }, { text:`(§f${sendAmount}§6) §fを送信しました` } ] });
            player.playSound("random.orb", { pitch:1.2 });
            target.sendMessage({ rawtext:[ { text:`§7${player.name} §fから §6` }, { translate:itemName }, { text:`(§f${sendAmount}§6) §fを受け取りました` } ] });
            target.playSound("random.orb", { pitch:1.2 });
        }

    }



    
}