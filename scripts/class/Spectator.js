import { world, system, Player, ItemStack, Block, } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";
import { config } from "../config";
import { Vector } from "../lib/Vector";

export class SpecAssist {
    
    /**
     * テレポートフォームを表示
     * @param {Player} player 
     */
    static showTeleportForm(player) {
        //スペクテイターかどうか
        if(!Util.isSpectator(player) && !Util.isCreative(player))return player.sendMessage(`§cこの機能はサバイバルモードでは使用できません`);

        const players = world.getPlayers();
        const form = new ActionFormData();
        form.title(`プレイヤー一覧`);
        form.body(`テレポートするプレイヤーを選択してください`);
        for(const target of players) {
            const dimensionId = target.dimension.id.replace(`minecraft:`, ``);

            form.button(`${target.name}\n${dimensionId}`);
        }
        form.show(player).then(res => {
            if(res.canceled)return;

            const target = players[res.selection];
            player.teleport(target.location, { rotation:target.getRotation() });
        });

    }


    /**
     * 
     * @param {Player} player 
     */
    static runTick(player) {
        //スペクテイターかどうか
        if(!Util.isSpectator(player))return;

        //座標が範囲外かどうか
        if(player.location.y >= 320 || player.location.y <= -64)return;

        const block = player.dimension.getBlock(player.location);

        //ネザーポータル
        if(block?.typeId == `minecraft:portal`) {
            //オーバーワールド >> ネザー
            if(player.dimension.id == `minecraft:overworld`) {
                player.setGameMode(`Creative`);

                const num = system.runInterval(() => {
                    if(player.dimension.id == `minecraft:nether`) {
                        player.teleport(Vector.addsX(player.location, 3));
                        player.setGameMode(`Spectator`);
                        system.clearRun(num);
                    }
                });
            }
        }
    }
}



function getNetherPos(pos) {
    return ;
}