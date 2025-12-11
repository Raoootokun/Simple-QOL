import { world, system, ItemStack, Player, MolangVariableMap, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";


export class Chunk {
    /**
     * @param {Player} player 
     */
    static run(player) {
        if(system.currentTick % 20 != 0)return;
        if(player.location.y < -64 || player.location.y > 320)return;

        const showChunk = playerDB.get(player, "showChunk");
        if(!showChunk)return;

        //パーティクルを表示
        Chunk.spawnChunkBorderParticles(player);
    }


    /**
     * 自分のいるチャンクの最小値を取得
     * @param {*} pos 
     * @returns { { x:number, z:number} }
     */
    static getChunkMinPos(pos) {
        // 自分がいるチャンク座標を計算
        const chunkX = Math.floor(pos.x / 16);
        const chunkZ = Math.floor(pos.z / 16);

        // チャンクの最小座標を計算
        const minX = chunkX * 16;
        const minZ = chunkZ * 16;

        return { minX, minZ }
    }


    static spawnChunkBorderParticles(player, spacing = 1) {
        // チャンク最小座標を取得
        const pos = Vector.round(player.location);
        const { minX, minZ } = Chunk.getChunkMinPos(pos);

        const maxX = minX + 16 - 0;
        const maxZ = minZ + 16 - 0;

        // X方向の辺（南北）
        for (let x = minX; x <= maxX; x += spacing) {
            Chunk.spawnParticle(player, { x:x, y:pos.y, z:minZ }); // 南側
            Chunk.spawnParticle(player, { x:x, y:pos.y, z:maxZ }); // 北側
        }

        // Z方向の辺（西東）
        for (let z = minZ + spacing; z < maxZ; z += spacing) { // +spacingで角の重複防止
            Chunk.spawnParticle(player, { x:minX, y:pos.y, z:z }); // 西側
            Chunk.spawnParticle(player, { x:maxX, y:pos.y, z:z }); // 東側
        }
    }

    static spawnParticle(player, pos) {
        const molang = new MolangVariableMap();
        molang.setColorRGB("variable.color", { red:1.0, green:0.3, blue:0.0 });
        molang.setVector3("variable.direction", { x:0, y:0, z:0 });

        try{
            player.spawnParticle("minecraft:wax_particle", { x:pos.x+0.0, y:pos.y+0.2, z:pos.z+0.0 }, molang)
        }catch(e){};
    }



    /**
     * チャンクの表示、非表示を設定
     * @param {Player} player 
     * @param {boolean} bool 
     * @param {boolean} isAnnounce 
     */
    static set(player, bool, isAnnounce = true) {
        if(bool == undefined)return player.sendMessage(`§fチャンク表示: §f${QOL_Util.getBoolText(Chunk.get(player))}`);

        if(isAnnounce)player.sendMessage(`§fチャンク表示を §f${QOL_Util.getBoolText(bool)} §fにしました`);
        playerDB.set(player, "showChunk", bool);
    }

    static get(player) {
        return playerDB.get(player, "showChunk") ?? false;
    }
}