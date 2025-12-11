import { world, system, Player, Difficulty } from "@minecraft/server";
import { log, Util } from "../lib/Util";

export class Diff {
    
    /**
     * 難易度を設定します
     * @param {Player} player 
     * @param {string} difficulty 
     * @returns 
     */
    static set(player, difficulty) {
        if(!difficulty)return player.sendMessage(`§f難易度: §d${world.getDifficulty()}`);
        const list = {
            "h": Difficulty.Hard,
            "n": Difficulty.Normal,
            "e": Difficulty.Easy,
            "p": Difficulty.Peaceful,
        };

        if(!Object.keys(list).includes(difficulty))return player.sendMessage(`§cエラー: 難易度が見つかりません`);

        world.setDifficulty(list[difficulty]);
        player.sendMessage(`§f難易度を §d${list[difficulty]} §fに設定しました`);
    };
}