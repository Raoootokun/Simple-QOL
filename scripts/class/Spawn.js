import { world, system, Player,  } from "@minecraft/server";
import { log, Util } from "../lib/Util";

export class Spawn {

    /**
     * スポーン/ログイン時に実行
     * @param {Player} player 
     */
    static run(player) {
        const time = 15;

        player.addEffect("resistance", time*20, { amplifier:255, showParticles:false });
    }
}