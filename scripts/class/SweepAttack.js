import { world, system, Player, ItemStack, Entity, EntityDamageCause, MolangVariableMap, EnchantmentType, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";


export class SweepAttack {
    static cooldown = 12;

    constructor(player, itemStack) {
        /** @type {Player} */ this.player = player;
        /** @type {ItemStack} */ this.itemStack = itemStack;
    }

    run() {
        if(!SweepAttack.get(this.player))return;
        
        //剣かどうか
        if(!this.itemStack)return;
        if(!this.itemStack.typeId.includes("sword"))return;

        //ダッシュ中 & 空中にいるときはキャンセル
        if(this.player.isSprinting || !this.player.isOnGround)return;

        //cd中はキャンセル
        if(this.player.sweepAttackCd > 0) {
            this.player.sweepAttackCd = SweepAttack.cooldown;
            return;
        }

        //cd発生
        this.player.sweepAttackCd = SweepAttack.cooldown;

        //ダメージ
        const damage = SweepAttack.getDamage(this.itemStack);

        //エンティティを取得して攻撃
        for(const target of this.getEntities()) {
            target.applyDamage(damage, { damagingEntity:this.player, cause:EntityDamageCause.entityAttack, });
        }

        //パーティクル、サウンド
        this.spawnEffects();
    }

    /**
     * エンティティを取得
     * @returns {Entity[]}
     */
    getEntities() {
        const entities = [];

        const playerPos = this.player.location;
        const view = this.player.getViewDirection();

        const vecArr = [
            { x:-1, y:0.0, z:1 },
            { x:0, y:0.0, z:1 },
            { x:1, y:0.0, z:1 },

            { x:-2, y:0.0, z:2 },
            { x:-1, y:0.0, z:2 },
            { x:0, y:0.0, z:2 },
            { x:1, y:0.0, z:2 },
            { x:2, y:0.0, z:2 },

            /*

         xxxxx
          xxx


             */
        ];

        for(let y=-1; y<=1; y++) {
            for(const vec of vecArr) {
                vec.y = y;
                const pos = Vector.offsetDirct(playerPos, vec, view);
                for(const entity of this.player.dimension.getEntities({
                    location: pos,
                    maxDistance: 1,
                    excludeTypes: [
                        "item",
                        "ender_crystal",
                        "arrow",
                        "thrown_trident",
                        "player"
                    ],
                    excludeNames: [ this.player.name ]
                })) {
                    //追加済みかどうか
                    if(entities.map(e => { return e.id; }).includes(entity.id))continue;

                    entities.push(entity);
                }
            }
        }
        
        return entities;
    }


    /**
     * パーティクル、サウンドを召喚
     */
    spawnEffects() {
        //音
        this.player.playSound("item.trident.riptide_1", { volume:0.6, pitch:2 });

        //パーティクル
        const view = this.player.getViewDirection();
        const playerPos = Vector.offsetDirct(this.player.location, { x:0, y:1.2, z:0.5 }, view);

        const molang = new  MolangVariableMap;
        molang.setVector3("variable.direction", { x:0, y:0, z:0 });

        for (const pos of getSweepEllipsePositions(playerPos, view)) {
            try{
                this.player.dimension.spawnParticle("minecraft:basic_crit_particle", pos, molang);
            }catch(e){};
        }
    }

    /**
     * ダメージ増加のエンチャントのダメージを取得
     * @param {ItemStack} itemStack
     * @returns {number}
     */
    static getDamage(itemStack) {
        const enchantComp = itemStack.getComponent("enchantable");

        for(const enchantment of enchantComp.getEnchantments()) {
            if(enchantment.type.id != "sharpness")continue;
            return 0.5 + (1.25 * enchantment.level);
        }

        return 0.5;
    }

    static get(player) {
        return playerDB.get(player, "sweepAttack") ?? true;
    }

    /**
     * 範囲攻撃の設定を行います
     * @param {Player} player 
     * @param {Boolean} bool 
     * @param {string} isAnnounce 
     * @returns 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§f範囲攻撃: §f${QOL_Util.getBoolText(SweepAttack.get(player))}`);

        if(isAnnounce)player.sendMessage(`§f範囲攻撃を §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "sweepAttack", bool);
    }
};



function getSweepEllipsePositions(origin, forward) {

    // ---- パラメータ ----
    const radiusX = 2.4;   // 横方向
    const radiusZ = 1.8;   // 前方向
    const arcAngleDeg = 120;
    const step = 0.1;

    // XZと同じ丸みをYに適用する高さ係数
    const heightScale = 0.6; // お好みで 0.3〜0.8くらいが自然

    // ---- utilities ----
    const normalize = (v) => {
        const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        return { x: v.x/len, y: v.y/len, z: v.z/len };
    };

    const cross = (a, b) => ({
        x: a.y*b.z - a.z*b.y,
        y: a.z*b.x - a.x*b.z,
        z: a.x*b.y - a.y*b.x
    });

    const add = (a, b) => ({
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
    });

    // ---- 軌道生成 ----
    const f = normalize(forward);
    const up = { x: 0, y: 1, z: 0 };

    const forwardBase = normalize({ x: f.x, y: 0, z: f.z });
    const right = normalize(cross(forwardBase, up));

    const arcRad = (arcAngleDeg * Math.PI) / 180;
    const positions = [];

    for (let t = -arcRad / 2; t <= arcRad / 2; t += step) {

        // ---- 楕円（XZ） ----
        const ellipseX = Math.sin(t) * radiusX;
        const ellipseZ = Math.cos(t) * radiusZ;

        // ---- Y方向にも同じ丸み ----
        //   → cos(t) を使うことで中心が高く、端が低くなる均等な丸みになる
        const ellipseY = (Math.cos(t) - 1) * heightScale; 
        // ※ (cos(t)-1) は中心で0、端で負… → 必要なら - をつけて反転可能

        const dir = {
            x: forwardBase.x * ellipseZ + right.x * ellipseX,
            y: ellipseY,
            z: forwardBase.z * ellipseZ + right.z * ellipseX
        };

        positions.push(add(origin, dir));
    }

    return positions;
}