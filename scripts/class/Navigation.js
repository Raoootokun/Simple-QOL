import { world, system, Player, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { PlayerDatabase } from "../lib/Database";
import { Dead } from "./Dead";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Vector } from "../lib/Vector";
import { QOL_Util } from "./QOL_Util";

const db = new PlayerDatabase("player-navi-db");

export class Navigation {
    constructor(player) {
        /** @type {Player} */ this.player = player;
    }

    run() {
        this.targetType = db.get(this.player, "targetType");
        this.targetDatail = db.get(this.player, "targetDatail");

        if(!this.targetType || this.targetType == "cancel")return;

        //targetの情報
        const targetInfo = this.getTargetInfo();
        if(targetInfo.isNotFound) {
            return `§d--- ナビゲーション ---\n§7ナビ先: ${targetInfo.text}§c(取得できません)\n§d----------------`
        }

        const actionbarArr = [
            `§d--- ナビゲーション ---`,
            `§7ナビ先: ${targetInfo.text}`,
            `§7座標: §c${targetInfo.pos.x.toFixed(1)}§7, §a${targetInfo.pos.y.toFixed(1)}§7, §b${targetInfo.pos.z.toFixed(1)}§7 (§6${targetInfo.distance}m§7)`,
            `§7ディメンション: ${targetInfo.dimensionId.replace("minecraft:", "")}`,
            `§d----------------`
        ];

        //同じディメンションかどうか
        if(this.player.dimension.id == targetInfo.dimensionId) {
            //何tickごとに実行するか
            const tick = 10;
            if(system.currentTick % tick == 0)this.spawnParticle(targetInfo.pos, targetInfo.distance);
        }

        return actionbarArr.join("\n");
    }

    /**
     * targetDatailから座標を取得します 
     * @returns { { pos:{ x:number, y:number, z:number }, distance:number, dimensionId:string, text:string } }
     */
    getTargetInfo() {
        if(this.targetType == "dead") {
            return {
                pos: this.targetDatail.pos,
                distance: this.player.dimension.id == this.targetDatail.dimensionId ? `${Vector.distance(this.player.location, this.targetDatail.pos).toFixed(1)}` : `--`,
                dimensionId: this.targetDatail.dimensionId,
                text: `死亡座標 / §e経過時間: ${QOL_Util.getTimeStr(Math.round(system.currentTick - this.targetDatail.tick)/20)}`
            };
        }
        
        if(this.targetType == "player") {
            const target = world.getPlayers({ name:this.targetDatail })[0];
            if(!target)return { text: this.targetDatail, isNotFound:true };

            return {
                pos: target.location,
                distance: this.player.dimension.id == target.dimension.id ? `${Vector.distance(this.player.location, target.location).toFixed(1)}` : `--`,
                dimensionId: target.dimension.id,
                text: this.targetDatail,
            };
        };

    }

    spawnParticle(targetPos, distance) {
        const spacing = 0.5; //パーティクルの間隔
        const height = 0.9; //パーティクルの高さ
        const maxCount = 10;

        //表示数 * 間隔
        let cnt = spacing * maxCount;
        if(distance <= cnt)cnt -= cnt - Math.round(distance);

        const vasePos = Vector.addsY(this.player.location, height);
        const vec = Vector.normalize(Vector.subtract(targetPos, vasePos));
        
        for(let i=0.0; i<cnt; i+=spacing) {
            const spawnPos = Vector.add(vasePos, Vector.multiply(vec, i));

            try{
                this.player.spawnParticle("minecraft:basic_flame_particle", spawnPos);
            }catch(e){};
        }
    }


    /**
     * ナビ先を設定
     * @param {Player} player 
     * @param {string} targetType 
     */
    static set(player, targetType) {
        switch(targetType) {
            case "cancel": {
                player.sendMessage(`§fナビゲーションをキャンセルしました`);
                db.set(player, "targetType", targetType);
                break;
            }
            case "dead": Navigation.showSelectForm_dead(player); break;
            case "player": Navigation.showSelectForm_player(player); break;
        };
    }


    /**
     * 
     * @param {Player} player 
     */
    static showSelectForm_dead(player) {
        const list = Dead.get(player);

        const form = new ActionFormData();
        form.title(`ナビゲーション`);
        form.body(`ナビゲーション先を指定してください`);
        for(const data of list) {
            const pos = `§c${data.pos.x.toFixed(1)}§8,§a${data.pos.y.toFixed(1)}§8,§b${data.pos.z.toFixed(1)}§8`;
            const dateInfo = `${data.dateInfo.day}/${data.dateInfo.time}`;
            const dimensionId = `${data.dimensionId.replace("minecraft:", "")}`;
            const cause = `${Dead.getCauseText(data.cause)}`;
            const tick = `${QOL_Util.getTimeStr((system.currentTick - data.tick) / 20)}`;
            const dis = player.dimension.id == data.dimensionId ? `${Vector.distance(player.location, data.pos).toFixed(1)}` : `--`;

            form.button(`${pos}(${dis}m,${dimensionId})\n${cause} [§0${dateInfo}§8]`)
        };
        form.show(player).then(res => {
            if(res.canceled)return;

            const data = list[res.selection];

            player.sendMessage(`§fナビゲーション先を (§c${data.pos.x.toFixed(1)}§f, §a${data.pos.y.toFixed(1)}§f, §b${data.pos.z.toFixed(1)}§f) §fに設定しました`);

            db.set(player, "targetType", "dead");
            db.set(player, "targetDatail", data);
        })
    }

    /**
     * 
     * @param {Player} player 
     */
    static showSelectForm_player(player) {
        const list = world.getPlayers( );

        const form = new ActionFormData();
        form.title(`ナビゲーション`);
        form.body(`ナビゲーション先を指定してください`);
        for(const target of list) {
            const pos = `§c${target.location.x.toFixed(1)}§8,§a${target.location.y.toFixed(1)}§8,§b${target.location.z.toFixed(1)}§8`;
            const dimensionId = `${target.dimension.id.replace("minecraft:", "")}`;
            const dis = player.dimension.id == target.dimension.id ? `${Vector.distance(player.location, target.location).toFixed(1)}` : `--`;

            form.button(`§8${target.name}\n${pos}(${dis}m,${dimensionId})`);
        };
        form.show(player).then(res => {
            if(res.canceled)return;

            const target = list[res.selection];

            player.sendMessage(`§fナビゲーション先を §7${target.name} §fに設定しました`);

            db.set(player, "targetType", "player");
            db.set(player, "targetDatail", target.name);
        })
    }



    
}