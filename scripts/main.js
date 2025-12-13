import { world, system, BlockTypes, } from "@minecraft/server";
import { log, Util } from "./lib/Util";
import { WorldLoad } from "./lib/WorldLoad"

import { QOL_Util } from "./class/QOL_Util";
import { Navigation } from "./class/Navigation";
import { SweepAttack } from "./class/SweepAttack";
import { Item } from "./class/Item";
import { Chunk } from "./class/Chunk";
import { DynamicLight } from "./class/DynamicLight";
import { Score } from "./class/Score";
import { Ikkatu } from "./class/Ikkatu";
import { BlockSit } from "./class/BlockSit";
import { PlayerBOT } from "./class/PlayerBOT";

import "./events"
import "./customCommands"


export const VERSION = [ 1, 1, 0 ];
WorldLoad.subscribe(() => {
    world.sendMessage(`[§bSimple QOL ver${VERSION.join(".")}§f] Reload`);

    //スコアボード
    Score.worldLoad();

    system.runInterval(() => {
        //プレイヤーを取得
        const allPlayers = world.getPlayers();
        const players = allPlayers.filter(p => { if(!p.hasTag("isBOT"))return p; })
        const bots = allPlayers.filter(p => { if(p.hasTag("isBOT"))return p; })

        for(const player of players) {
            const actionbarArr = [];

            //体力表示
            const healthCopm = player.getComponent("health");
            const max = healthCopm.defaultValue;
            const current = healthCopm.currentValue;
            const healthTxt = `\uE10C §c${Math.round(current)}§f/§c${Math.round(max)}§f`;

            //オンライン時間を取得
            const onlineSec = Math.round(Score.getScore(player, Score.id.online_time) / 20);
            const onLineTxt = `§8${QOL_Util.getTimeStr(onlineSec)}`;

            player.nameTag = `${healthTxt}\n§f${player.name}`;

            //アイテムの耐久値を表示
            Item.checkInventory(player);

            //チャンク
            Chunk.run(player);

            //範囲攻撃のCDの処理
            if(player.sweepAttackCd != undefined) {
                if(player.sweepAttackCd > 0) {
                    player.sweepAttackCd--;

                    const gage = `${QOL_Util.createGage(SweepAttack.cooldown-player.sweepAttackCd, SweepAttack.cooldown, "§f-", "§8-")}`;
                    const sec = `${(player.sweepAttackCd/20).toFixed(1)}s`;
                    actionbarArr.push(`${gage} §7/ ${sec}`);
                }
                if(player.sweepAttackCd <= 0)delete player.sweepAttackCd;
            }

            //一括破壊
            if(player.isSneaking) {
                if(!player.isFirstSneak){ 
                    player.isFirstSneak = true;
                }
            }else {
                if(player.isFirstSneak) {
                    delete player.isFirstSneak;
                    Ikkatu.change(player);

                }
            }

            const isActiveMine = Ikkatu.getActive(player, "mineall");
            const isActiveCut = Ikkatu.getActive(player, "cutall");
            if(isActiveMine)actionbarArr.push(`§7-- §aマインオール発動中 §7--`);
            if(isActiveCut)actionbarArr.push(`§7-- §aカットオール発動中 §7--`);

            //ナビゲーション
            const navi = new Navigation(player);
            const naviTxt = navi.run();
            if(naviTxt)actionbarArr.push(naviTxt);

            //ダイナミックライト
            DynamicLight.run(player);
        
            //スコア
            Score.runTick(player);

            //アクションバーを表示
            if(actionbarArr.length > 0) {
                let actionbarTxt = actionbarArr.join("\n§r§f");
                player.onScreenDisplay.setActionBar(actionbarTxt);
            }else {
                player.onScreenDisplay.setActionBar("§1");
            };
        };

        for(const bot of bots) {
            PlayerBOT.runTick(bot);
        };

        //シートチェック
        BlockSit.checkSeats();

        //プレイヤーの割合を取得
        const botPer = (players.length / allPlayers.length) * 100;
        world.gameRules.playersSleepingPercentage = botPer;
    });
});