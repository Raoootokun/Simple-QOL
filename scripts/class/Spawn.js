import { world, system, Player,  } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { config } from "../config";

export class Spawn {

    /**
     * スポーン/ログイン時に実行
     * @param {Player} player 
     * @param {boolean} initialSpawn 
     */
    static run(player, initialSpawn) {
        if(initialSpawn)player.addEffect("resistance", config.login_resistance_sec * 20, { amplifier:255, showParticles:false });
        else player.addEffect("resistance", config.respawn_resistance_sec * 20, { amplifier:255, showParticles:false });
    }
}