import { world, system, ItemStack, Player, Entity, } from "@minecraft/server";
import { log, Util } from "../lib/Util";

export class Item {
    
    /**
     * インベントリをチェックし、アイテムに耐久値を記入します
     * @param {Player} player 
     */
    static checkInventory(player) {
        //インベントリ
        const invComp = player.getComponent("inventory");
        const container = invComp.container;
        for(let i=0; i<container.size; i++) {
            const itemStack = container.getItem(i);
            if(!itemStack)continue;

            const lore = [];
            const duraTxt = Item.getDuraText(itemStack);
            const foodTxt = Item.getFoodText(itemStack);

            if(duraTxt)lore.push(duraTxt);
            if(foodTxt)lore.push(foodTxt);

            //保存
            if(lore.length > 0) {
                itemStack.setLore(lore);
                container.setItem(i, itemStack);
            }
        }

        //装備スロット
        const equipComp = player.getComponent("equippable");
        for(const slot of [ "Head", "Chest", "Legs", "Feet", "Offhand" ]) {
            const itemStack = equipComp.getEquipment(slot);
            if(!itemStack)continue;

            const duraTxt = Item.getDuraText(itemStack);
            if(duraTxt) {
                itemStack.setLore([ duraTxt ]);
                equipComp.setEquipment(slot, itemStack);
            }
        }
    }


    /**
     * 耐久値がある場合 --/-- の形式で返します
     * @param {ItemStack} itemStack 
     * @returns {string | undefined}
     */
    static getDuraText(itemStack) {
        //耐久値があるか
        const duraComp = itemStack.getComponent("durability");
        if(!duraComp)return undefined;

        const max = duraComp.maxDurability;
        const current = max - duraComp.damage;
        return `§r§7耐久値: §e${current}/${max}`;
    }

    /**
     * 食べ物の場合  で返します
     * @param {ItemStack} itemStack 
     * @returns {string | undefined}
     */
    static getFoodText(itemStack) {
        //耐久値があるか
        const foodData = foodDataList[itemStack.typeId];
        if(!foodData)return;

        //食べた時の回復する満腹度
        const nutrition = foodData.nutrition;
        //食べた時に回復する隠し満腹度
        const saturation = foodData.saturation;

        let txt = `§r§7満腹度: `;
        if(nutrition > 6) {
            txt += `\ue100\ue100\ue100\ue100\ue100\ue100...`;
        }else {
            for(let i=0; i<Math.floor(nutrition); i++) {
                txt += `\ue100`;
            }
        }
        txt += `(${nutrition})\n`;

        txt += `§r§7隠し満腹度: `;
        if(saturation > 6) {
            txt += `\ue100\ue100\ue100\ue100\ue100\ue100...`;
        }else {
            for(let i=0; i<Math.floor(saturation); i++) {
                txt += `\ue100`;
            }
        }
        txt += `(${saturation})`;

        return txt;
    }


    /**
     * アイテムの名前を取得します
     * @param {ItemStack} itemStack 
     * @returns {string | { translate: string}}
     */
    static getName(itemStack) {
        if(itemStack.nameTag)return itemStack.nameTag;
        else return itemStack.localizationKey;
    }

    /**
     * アイテムに満腹度・耐久値を書き込みます
     * @param {ItemStack} itemStack 
     */
    static setLore(itemStack) {
        const lore = [];
        const duraTxt = Item.getDuraText(itemStack);
        const foodTxt = Item.getFoodText(itemStack);

        if(duraTxt)lore.push(duraTxt);
        if(foodTxt)lore.push(foodTxt);

        //保存
        if(lore.length > 0)itemStack.setLore(lore);

        return lore.length > 0;
    }

    /**
     * アイテムのドロップ時に満腹度・耐久値を書き込みます
     * @param {Entity} itemEntity 
     */
    static spawn(itemEntity) {
        const itemStack = itemEntity.getComponent("item").itemStack;
        if(itemStack.getLore().length > 0)return;

        const res = Item.setLore(itemStack);
        if(!res)return;

        const newItemStack = itemStack.clone();
        const pos = itemEntity.location;
        const dimension = itemEntity.dimension;

        itemEntity.remove();

        const newItemEntity = dimension.spawnItem(newItemStack, pos);
        newItemEntity.clearVelocity();
    }


    
}


const foodDataList = {
    "minecraft:apple": { nutrition:4, saturation:2.4 },
    "minecraft:golden_apple": { nutrition:4, saturation:9.6 },
    "minecraft:enchanted_golden_apple": { nutrition:4, saturation:9.6 },
    "minecraft:carrot": { nutrition:3, saturation:3.6 },
    "minecraft:potato": { nutrition:1, saturation:0.6 },
    "minecraft:beetroot": { nutrition:1, saturation:1.2 },
    "minecraft:poisonous_potato": { nutrition:2, saturation:1.2 },
    "minecraft:melon_slice": { nutrition:2, saturation:1.2 },
    "minecraft:sweet_berries": { nutrition:2, saturation:1.2 },
    "minecraft:glow_berries": { nutrition:2, saturation:2.4 },
    "minecraft:golden_carrot": { nutrition:6, saturation:14.4 },

    "minecraft:cooked_chicken": { nutrition:6, saturation:7.2 },
    "minecraft:cooked_porkchop": { nutrition:8, saturation:12.8 },
    "minecraft:cooked_beef": { nutrition:8, saturation:12.8 },
    "minecraft:cooked_mutton": { nutrition:6, saturation:9.6 },
    "minecraft:cooked_rabbit": { nutrition:5, saturation:6 },
    "minecraft:cooked_cod": { nutrition:5, saturation:6 },
    "minecraft:cooked_salmon": { nutrition:6, saturation:9.6 },

    "minecraft:chicken": { nutrition:2, saturation:1.2 },
    "minecraft:porkchop": { nutrition:3, saturation:1.8 },
    "minecraft:beef": { nutrition:3, saturation:1.8 },
    "minecraft:mutton": { nutrition:2, saturation:1.2 },
    "minecraft:rabbit": { nutrition:3, saturation:1.8 },
    "minecraft:cod": { nutrition:2, saturation:0.4 },
    "minecraft:salmon": { nutrition:2, saturation:0.4 },
    "minecraft:tropical_fish": { nutrition:1, saturation:0.2 },
    "minecraft:pufferfish": { nutrition:1, saturation:0.2 },
    
    "minecraft:bread": { nutrition:5, saturation:6 },
    "minecraft:mushroom_stew": { nutrition:6, saturation:7.2 },
    "minecraft:beetroot_soup": { nutrition:6, saturation:7.2 },
    "minecraft:rabbit_stew": { nutrition:10, saturation:12 },
    "minecraft:suspicious_stew": { nutrition:6, saturation:7.2 },
    "minecraft:pumpkin_pie": { nutrition:8, saturation:4.8 },
    "minecraft:dried_kelp": { nutrition:1, saturation:0.6 },
    "minecraft:cookie": { nutrition:2, saturation:0.4 },
    "minecraft:baked_potato": { nutrition:5, saturation:6 },

    "minecraft:rotten_flesh": { nutrition:4, saturation:0.8 },
    "minecraft:spider_eye": { nutrition:2, saturation:3.2 },
    "minecraft:chorus_fruit": { nutrition:4, saturation:2.4 },
    "minecraft:honey_bottle": { nutrition:6, saturation:1.2 },
}