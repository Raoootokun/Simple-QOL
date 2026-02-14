import { world, system, Player, ItemStack, Block, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";

export class Infobar {
    constructor(player) {
        /** @type {Player} */ this.player = player;
        this.arr = [];
    }

    run() {
        //装備の耐久値を表示
        this.setDurabilityText();
        this.setBiomeText();
        this.setPortalPosText();

        return this.arr.join("\n§r§f")
    }

    setDurabilityText() {
        const obj = {};

        const equipComp = this.player.getComponent("equippable");
        for(const slot of [ "Mainhand", "Offhand", "Head", "Chest", "Legs", "Feet" ]) {
            const itemStack = equipComp.getEquipment(slot);
            const dura = this.getDurability(itemStack);

            obj[slot] = dura ? `§e${dura.current}§7/§e${dura.max}§7` : `-/-`;
        };
        
        this.arr.push(`§7Mainhand: ${obj.Mainhand}  Offhand: ${obj.Offhand}`);
        this.arr.push(`§7Head: ${obj.Head}`);
        this.arr.push(`§7Chest: ${obj.Chest}`);
        this.arr.push(`§7Legs: ${obj.Legs}`);
        this.arr.push(`§7Feet: ${obj.Feet}`);
    }

    setBiomeText() {
        const biome = this.player.dimension.getBiome(this.player.location);
        this.arr.push(`§7Biome: ${biome.id.replace("minecraft:", "")}`);
    }

    setPortalPosText() {

        if(this.player.dimension.id == "minecraft:nether") {
            const X = Math.floor(this.player.location.x / 8);

            this.arr.push(X)
        }
    }
    

    /**
     * アイテムの耐久値を取得
     * @param {ItemStack} itemStack 
     * @returns { { current:number, max:number } }
     */
    getDurability(itemStack) {
        const duraComp = itemStack?.getComponent("durability");
        if(!duraComp)return undefined;

        const max = duraComp.maxDurability;
        const current = max - duraComp.damage;
        return { current:current, max:max };
    }


    /**
     * SET
     * @param {Player} player 
     * @param {boolean} bool
     * @param {boolean} isAnnounce 
     * @param {string} infoId 
     */
    static set(player, bool, isAnnounce = true, infoId) {
        if(bool == undefined)return player.sendMessage(`§fクイックドロップ: §f${QOL_Util.getBoolText(QuickDrop.get(player))}`);

        if(isAnnounce)player.sendMessage(`§fクイックドロップを §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "quickDrop", bool);
    }

    /**
     * GET
     * @param {Player} player 
     * @returns {boolean}
     */
    static get(player) {
        return playerDB.get(player, "quickDrop") ?? true;
    }
}