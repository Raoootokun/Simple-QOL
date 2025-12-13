import { world, system, Player, Entity, Block, Scoreboard, ScoreboardObjective, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";
import { ActionFormData } from "@minecraft/server-ui";
import { QOL_Util } from "./QOL_Util";


export class Score {
    /** @type {Scoreboard} */ static scoreboard;
    /** @type {{}} */ static objectives;

    static get list() {
        return {
            "logout": "ログイン回数",

            "playtime": "プレイ時間",
            "playtime_min": "プレイ時間(分)",
            "online_time": "オンライン時間",
            "online_time_min": "オンライン時間(分)",
            "max_online_time": "最大オンライン時間",
            "max_online_time_min": "最大オンライン時間(分)",

            "jump": "ジャンプ回数",
            "sneak": "スニーク回数",
            "glyding": "飛んだ距離(m)",
            "swim": "泳いだ距離(m)",
            "walk": "歩いた距離(m)",
            "fall": "落ちた距離(m)",
            "move": "移動した距離(m)",

            "kill": "キル数",
            "kill_moster": "モンスターキル数",
            "kill_animal": "動物キル数数",
            "kill_player": "プレイヤーキル数",
            "kill_villager": "村人キル数",
            "kill_zombie": "ゾンビキル数",
            "kill_skeleton": "スケルトンキル数",
            "kill_creeper": "クリーパーキル数",
            "kill_wither": "ウィザーキル数",
            "kill_dragon": "エンダードラゴンキル数",
            "kill_warden": "ウォーデンキル数",
            "kill_by_bow": "弓によるキル数",

            "die": "死亡回数",

            "attack": "攻撃回数",
            "add_damage": "与えた総ダメージ",
            "add_max_damage": "最大与ダメージ",
            "hurt_damage": "受けたダメージ",

            "shoot_bow": "弓を撃った回数",

            "place_block": "ブロック設置数",
            "place_seed": "種を植えた数",

            "break_block": "ブロック破壊数",
            "break_ore": "鉱石破壊数",
            "break_diamond_ore": "ダイヤ鉱石破壊数",
            "break_netherite_ore": "古代の瓦礫破壊数",

            "interact_villager": "村人と話した回数"
        }
    };

    static get id() {
        let obj = {};
        for(const key of Object.keys(Score.list)) {
            obj[key] = key
        }

        return obj;

        return {
            "logout": "logout",

            "playtime": "playtime",     
            "playtime_min": "playtime_min",     
            "online_time": "online_time",
            "online_time_min": "online_time_min",
            "max_online_time": "max_online_time",
            "max_online_time_min": "max_online_time_min",

            "jump": "jump",
            "sneak": "sneak",
            "glyding": "glyding",
            "swim": "swim",
            "walk": "walk",
            "fall": "fall",
            "move": "move",

            "kill": "kill",
            "kill_moster": "kill_moster",
            "kill_animal": "kill_animal",
            "kill_player": "kill_player",
            "kill_villager": "kill_villager",
            "kill_zombie": "kill_zombie",
            "kill_skeleton": "kill_skeleton",
            "kill_creeper": "kill_creeper",
            "kill_wither": "kill_wither",
            "kill_dragon": "kill_dragon",
            "kill_warden": "kill_warden",
            "kill_by_bow": "kill_by_bow",

            "die": "die",

            "attack": "attack",
            "add_damage": "add_damage",
            "add_max_damage": "add_max_damage",
            "hurt_damage": "hurt_damage",

            "shoot_bow": "shoot_bow",

            "place_block": "place_block",
            "place_seed": "place_seed",

            "break_block": "break_block",
            "break_ore": "break_ore",
            "break_diamond_ore": "break_diamond_ore",
            "break_netherite_ore": "break_netherite_ore"
        };
    }

    /**
     * ワールドがロードされた際に実行
     */
    static worldLoad() {
        Score.scoreboard = world.scoreboard;
        Score.objectives = {}
        
        const list = Score.list;
        for(const key of Object.keys(list)) {
            let obje = Score.scoreboard.getObjective(key);
            //スコアボードを未作成の場合
            if(!obje)obje = Score.scoreboard.addObjective(key, list[key]);

            Score.objectives[key] = obje;
        }
    }

    /**
     * 全オブジェクトを初期化
     */
    static init() {
        const list = Score.list;
        for(const key of Object.keys(list)) {
            let obje = Score.scoreboard.getObjective(key);
            if(obje)Score.scoreboard.removeObjective(key);

            Score.objectives[key] = Score.scoreboard.addObjective(key, list[key]);
        }

        //プレイヤーのスコアを初期化
        for(const player of world.getPlayers()) {
            Score.resetAllScore(player);
        }
    }




    /**
     * 舞ティック実行
     * @param {Player} player 
     */
    static runTick(player) {
        //プレイ時間
        Score.addScore(player, Score.id.playtime, 1);
        const playtime = Score.getScore(player, Score.id.playtime);
        if(playtime % 1200 == 0)Score.addScore(player, Score.id.playtime_min, 1);

        //オンライン時間
        Score.addScore(player, Score.id.online_time, 1);
        const online_time = Score.getScore(player, Score.id.online_time);
        if(online_time % 1200 == 0)Score.addScore(player, Score.id.online_time_min, 1);

        //スニーク回数追加
        if(player.isSneaking) {
            if(!player.firstSneak_score) {
                player.firstSneak_score = true;
                Score.addScore(player, Score.id.sneak, 1);
            }
        }else {
            if(player.firstSneak_score)delete player.firstSneak_score;
        }

        //ジャンプ回数追加
        if(player.isJumping) {
            if(!player.firstJump_score) {
                player.firstJump_score = true;
                Score.addScore(player, Score.id.jump, 1);
            }
        }else {
            if(player.isOnGround && player.firstJump_score)delete player.firstJump_score;
        }

        //歩いた距離
        if(!player.isSwimming && !player.isGliding && !player.isFalling) {
            const oldWalkPos = player.oldWalkPos;
            if(oldWalkPos) {
                const nowPos = player.location;

                //保存した座標と現在の座標の距離を比較
                const dis = Vector.distance(nowPos, oldWalkPos);
                if(dis >= 1) {
                    //スコアに追加
                    const walkScore = Math.round(dis);
                    Score.addScore(player, Score.id.walk, walkScore);

                    //座標を保存
                    player.oldWalkPos = player.location;
                }
            }else player.oldWalkPos = player.location;
        }else delete player.oldWalkPos; 
        
        //泳いだ距離
        if(player.isSwimming) {
            const oldSwimPos = player.oldSwimPos;
            if(oldSwimPos) {
                const nowPos = player.location;

                //保存した座標と現在の座標の距離を比較
                const dis = Vector.distance(nowPos, oldSwimPos);
                if(dis >= 1) {
                    //スコアに追加
                    const swimScore = Math.round(dis);
                    Score.addScore(player, Score.id.swim, swimScore);

                    //座標を保存
                    player.oldSwimPos = player.location;
                }
            }else player.oldSwimPos = player.location;
        }else delete player.oldSwimPos;

        //飛行した距離
        if(player.isGliding) {
            const oldGlidPos = player.oldGlidPos;
            if(oldGlidPos) {
                const nowPos = player.location;

                //保存した座標と現在の座標の距離を比較
                const dis = Vector.distance(nowPos, oldGlidPos);
                if(dis >= 1) {
                    //スコアに追加
                    const swimScore = Math.round(dis);
                    Score.addScore(player, Score.id.glyding, swimScore);

                    //座標を保存
                    player.oldGlidPos = player.location;
                }
            }else player.oldGlidPos = player.location;
        }else delete player.oldGlidPos;

        //落下した距離
        if(player.isFalling) {
            const oldFallPos = player.oldFallPos;
            if(oldFallPos) {
                const nowPos = player.location;

                //保存した座標と現在の座標の距離を比較
                const dis = Vector.distance(nowPos, oldFallPos);
                if(dis >= 1) {
                    //スコアに追加
                    const swimScore = Math.round(dis);
                    Score.addScore(player, Score.id.fall, swimScore);

                    //座標を保存
                    player.oldFallPos = player.location;
                }
            }else player.oldFallPos = player.location;
        }else delete player.oldFallPos;

        //移動した距離
        const oldPos = player.oldPos;
        if(oldPos) {
            const nowPos = player.location;

            //保存した座標と現在の座標の距離を比較
            const dis = Vector.distance(nowPos, oldPos);
            if(dis >= 1) {
                //スコアに追加
                const swimScore = Math.round(dis);
                Score.addScore(player, Score.id.move, swimScore);

                //座標を保存
                player.oldPos = player.location;
            }
        }else player.oldPos = player.location;

        
    }

    /**
     * ログイン時に実行
     * @param {Player} player 
     */
    static runJoin(player) {
        //初ログインなら
        const login = Score.getScore(player, Score.id.logout);
        if(login == 0)Score.resetAllScore(player);

        const onlineScore = Score.getScore(player, Score.id.online_time);
        const maxOnlineScore = Score.getScore(player, Score.id.max_online_time);

        if(onlineScore > maxOnlineScore) {
            //最大オンライン時間を更新
            Score.setScore(player, Score.id.max_online_time, onlineScore);
            Score.setScore(player, Score.id.max_online_time_min, Math.round(onlineScore / 1200));
        }

        //オンライン時間リセット
        Score.setScore(player, Score.id.online_time, 0);
        Score.setScore(player, Score.id.online_time_min, 0);

        //ログイン追加
        Score.addScore(player, Score.id.logout, 1);
    }

    /**
     * ブロックを置いた時に実行
     * @param {Player} player 
     * @param {Block} block 
     */
    static runPlaceBlock(player, block) {
        Score.addScore(player, Score.id.place_block, 1);

        const seedIds = [
            "minecraft:carrots",
            "minecraft:potatoes",
            
            "minecraft:wheat",
            "minecraft:pumpkin_stem",
            "minecraft:melon_stem",
            "minecraft:beetroot",
            "minecraft:torchflower_crop",
            "minecraft:pitcher_crop",
        ];
        if(seedIds.includes(block?.typeId))Score.addScore(player, Score.id.place_seed, 1);
    }

    /**
     * ブロックを破壊した時に実行
     * @param {Player} player 
     * @param {Block} block 
     */
    static runBreakBlock(player, block) {
        const blockId = block.typeId;

        system.run(() => {
            Score.addScore(player, Score.id.break_block, 1);

            //鉱石を追加
            if(blockId.includes("ore")) {
                Score.addScore(player, Score.id.break_ore, 1);

                if(blockId.includes("diamond_ore"))Score.addScore(player, Score.id.break_diamond_ore, 1);
            };

            if(blockId == "minecraft:ancient_debris")Score.addScore(player, Score.id.break_netherite_ore, 1);
        });
    }

    /**
     * ダメージを受けた際に実行
     * @param {Player} hurtPlayer 
     * @param {Player} damagingPlayer 
     * @param {number} damage 
     */
    static runHurt(hurtPlayer, damagingPlayer, damage) {
        //殴られたエンティティがプレイヤーかどうか
        const hurtIsPlayer = Util.isPlyaer(hurtPlayer);
        //殴ったエンティティがプレイヤーかどうか
        const damageIsPlayer = Util.isPlyaer(damagingPlayer);

        if(hurtIsPlayer) {
            //受けたダメージ数追加
            Score.addScore(hurtPlayer, Score.id.hurt_damage, Math.round(damage));
        };

         if(damageIsPlayer) {
            //与えた最大ダメージを更新
            const addMaxDamage = Score.getScore(damagingPlayer, Score.id.add_max_damage);
            if(Math.round(damage) > addMaxDamage)Score.setScore(damagingPlayer, Score.id.add_max_damage, Math.round(damage));

            //与えたダメージ数追加
            Score.addScore(damagingPlayer, Score.id.add_damage, Math.round(damage));

            //攻撃数追加
            Score.addScore(damagingPlayer, Score.id.attack, 1);
        };
    }

    /**
     * 死んだ際に実行
     * @param {Player} deadPlayer 
     * @param {Player} damagingPlayer 
     * @param {Entity} damagingProjectile 
     * @param {string} cause 
     */
    static runDie(deadPlayer, damagingPlayer, damagingProjectile, cause) {
        //死んだエンティティがプレイヤーかどうか
        const deadIsPlayer = Util.isPlyaer(deadPlayer);
        //殺したエンティティがプレイヤーかどうか
        const damageIsPlayer = Util.isPlyaer(damagingPlayer);

        if(deadIsPlayer) {
            //死亡数追加
            Score.addScore(deadPlayer, Score.id.die, 1);
        };

         if(damageIsPlayer) {
            //キル数追加
            Score.addScore(damagingPlayer, Score.id.kill, 1);

            if(deadPlayer.isValid) {
                const isMonster = deadPlayer.matches({ families:["monster"] });
                if(isMonster) {
                    //モンスターキル数追加
                    Score.addScore(damagingPlayer, Score.id.kill_moster, 1);

                    //ゾンビキル数追加
                    const zombieIds = [
                        "minecraft:zombie",
                        "minecraft:husk",
                        "minecraft:zombie_villager",
                        "minecraft:zombie_villager_v2",
                        "minecraft:zombie_horse",
                        "minecraft:zombie_pigman",
                        "minecraft:zoglin",
                        "minecraft:drowned"
                    ];
                    if(zombieIds.includes(deadPlayer.typeId))Score.addScore(damagingPlayer, Score.id.kill_zombie, 1);

                    //スケルトンキル数追加
                    const skeletonIds = [
                        "minecraft:skeleton",
                        "minecraft:stray",
                        "minecraft:skeleton_horse",
                        "minecraft:wither_skeleton",
                        "minecraft:bogged",
                        "minecraft:NEW_HUSK_SKELETON",
                    ];
                    if(skeletonIds.includes(deadPlayer.typeId))Score.addScore(damagingPlayer, Score.id.kill_skeleton, 1);

                    //クリーパー
                    if(deadPlayer.typeId == "minecraft:creeper")Score.addScore(damagingPlayer, Score.id.kill_creeper, 1);

                    //ウォーデン
                    if(deadPlayer.typeId == "minecraft:warden")Score.addScore(damagingPlayer, Score.id.kill_warden, 1);
                }

                //モンスターキル数追加
                const isAnimal = deadPlayer.matches({ excludeFamilies:["monster"] });
                if(isAnimal)Score.addScore(damagingPlayer, Score.id.kill_animal, 1);
            }

            //プレイヤーキル数追加
            if(deadIsPlayer)Score.addScore(damagingPlayer, Score.id.kill_player, 1);

            //村人キル数追加
            if(deadPlayer.typeId == "minecraft:villager_v2")Score.addScore(damagingPlayer, Score.id.kill_villager, 1);

            //ドラゴン
            if(deadPlayer.typeId == "minecraft:ender_dragon")Score.addScore(damagingPlayer, Score.id.kill_dragon, 1);
            //ウィザー
            if(deadPlayer.typeId == "minecraft:wither")Score.addScore(damagingPlayer, Score.id.kill_wither, 1);

            //死因が弓かどうか
            if(cause == "projectile" && damagingProjectile?.typeId == "minecraft:arrow") {
                Score.addScore(damagingPlayer, Score.id.kill_by_bow, 1);
            }
            
        };
    }

    /**
     * インベントリした際に実行
     * @param {Player} player 
     * @param {Entity} target 
     */
    static runInteract(player, target) {
        system.run(() => {
            if(target.typeId == "minecraft:villager_v2") {
                //村人と話した数追加
                Score.addScore(player, Score.id.interact_villager, 1);
            }
        })
    }





    //==================================================
    //==================================================
    /**
     * 取得
     * @param {Player|string} player 
     */
    static getScore(player, id) {
        const playerName = (typeof player == "string") ? player : player.name;

        try{
            const score = Score.objectives[id].getScore(`§f${playerName}`);
            if(score == undefined)return 0
            else return score;
        }catch(e){
            return 0;
        }
    }

    /**
     * セット
     * @param {Player|string} player 
     */
    static setScore(player, id, score) {
        const playerName = (typeof player == "string") ? player : player.name;

        Score.objectives[id].setScore(`§f${playerName}`, score);
    }

    /**
     * 追加
     * @param {Player|string} player
     */
    static addScore(player, id, score) {
        const playerName = (typeof player == "string") ? player : player.name;

        const nowScore = Score.getScore(player, id);
        Score.objectives[id].setScore(`§f${playerName}`, nowScore+score);
    }

    /**
     * 全スコアをリセット(0)にします
     * @param {Player} player 
     */
    static resetAllScore(player) {
        for(const id of Object.keys(Score.id)) {
            Score.setScore(player, id, 0);
        }
    }
    //==================================================
    //==================================================



    //==================================================
    //==================================================
    /**
     * スコアを表示
     * @param {Player} player 
     * @param {string | undefined} targetName 
     */
    static showForm(player, targetName) {
        if(!targetName)targetName = player.name;

        let txt = ``;

        txt += `§f[一般]\n`;
        txt += `§7 - ログイン回数: §6${Score.getScore(targetName, Score.id.logout)}§7\n`;
        txt += `§7 - オンライン時間: §6${QOL_Util.getTimeStr(Math.round(Score.getScore(targetName, Score.id.online_time)/20))}§7\n`;
        txt += `§7 - 最大オンライン時間: §6${QOL_Util.getTimeStr(Math.round(Score.getScore(targetName, Score.id.max_online_time)/20))}§7\n`;
        txt += `§7 - 総プレイ時間: §6${QOL_Util.getTimeStr(Math.round(Score.getScore(targetName, Score.id.playtime)/20))}§7\n`;
        txt += `§f----------\n\n`;

        txt += `§f[操作]\n`;
        txt += `§7 - ジャンプ回数: §6${Score.getScore(targetName, Score.id.jump)}§7\n`;
        txt += `§7 - スニーク回数: §6${Score.getScore(targetName, Score.id.sneak)}§7\n\n`;

        txt += `§7 - ブロックを設置した回数: §6${Score.getScore(targetName, Score.id.place_block)}§7\n`;
        txt += `§7 - 種を植えた回数: §6${Score.getScore(targetName, Score.id.place_seed)}§7\n`;

        txt += `§7 - ブロックを破壊した回数: §6${Score.getScore(targetName, Score.id.break_block)}§7\n`;
        txt += `§7 - 鉱石を破壊した回数: §6${Score.getScore(targetName, Score.id.break_ore)}§7\n`;
        txt += `§7 - ダイヤ鉱石を破壊した回数: §6${Score.getScore(targetName, Score.id.break_diamond_ore)}§7\n`;
        txt += `§7 - 古代の残骸を破壊した回数: §6${Score.getScore(targetName, Score.id.break_netherite_ore)}§7\n`;

        txt += `§7 - 村人と話した回数   : §6${Score.getScore(targetName, Score.id.interact_villager)}§7\n`;
        txt += `§f----------\n\n`;

        txt += `§f[移動]\n`;
        txt += `§7 - 歩いた距離: §6${Score.getScore(targetName, Score.id.walk)}§7m\n`;
        txt += `§7 - 泳いだ距離: §6${Score.getScore(targetName, Score.id.swim)}§7m\n`;
        txt += `§7 - 飛んだ距離: §6${Score.getScore(targetName, Score.id.glyding)}§7m\n`;
        txt += `§7 - 落ちた距離: §6${Score.getScore(targetName, Score.id.fall)}§7m\n`;
        txt += `§7 - 移動した距離: §6${Score.getScore(targetName, Score.id.move)}§7m\n`;
        txt += `§f----------\n\n`;

        txt += `§f[キル/デス]\n`;
        txt += `§7 - 攻撃した回数: §6${Score.getScore(targetName, Score.id.attack)}§7\n`;
        txt += `§7 - キル回数: §6${Score.getScore(targetName, Score.id.kill)}§7\n`;
        txt += `§7 - キル回数(弓): §6${Score.getScore(targetName, Score.id.kill_by_bow)}§7\n`;
        txt += `§7 - デス回数: §6${Score.getScore(targetName, Score.id.die)}§7\n\n`;

        txt += `§7 - プレイヤーキル回数: §6${Score.getScore(targetName, Score.id.kill_player)}§7\n`;
        txt += `§7 - 村人キル回数: §6${Score.getScore(targetName, Score.id.kill_villager)}§7\n`;
        txt += `§7 - モンスター回数: §6${Score.getScore(targetName, Score.id.kill_moster)}§7\n`;
        txt += `§7 - 動物キル回数: §6${Score.getScore(targetName, Score.id.kill_animal)}§7\n`;
        txt += `§7 - ゾンビキル回数: §6${Score.getScore(targetName, Score.id.kill_zombie)}§7\n`;
        txt += `§7 - スケルトンキル回数: §6${Score.getScore(targetName, Score.id.kill_skeleton)}§7\n`;
        txt += `§7 - クリーパーキル回数: §6${Score.getScore(targetName, Score.id.kill_creeper)}§7\n`;
        txt += `§7 - ウォーデンキル回数: §6${Score.getScore(targetName, Score.id.kill_warden)}§7\n`;
        txt += `§7 - ウィザー回数: §6${Score.getScore(targetName, Score.id.kill_wither)}§7\n`;
        txt += `§7 - エンダードラゴン回数: §6${Score.getScore(targetName, Score.id.kill_dragon)}§7\n`;
        txt += `§f----------\n\n`;

        txt += `§f[ダメージ]\n`;
        txt += `§7 - 与えたダメージ: §6${Score.getScore(targetName, Score.id.add_damage)}§7\n`;
        txt += `§7 - 与えた最大ダメージ: §6${Score.getScore(targetName, Score.id.add_max_damage)}§7\n`;
        txt += `§7 - 受けたダメージ: §6${Score.getScore(targetName, Score.id.hurt_damage)}§7\n`;
        txt += `§f----------\n\n`;

        const form = new ActionFormData();
        form.title(`スコア`);
        form.body(txt);
        form.show(player);
    }

    /**
     * スコアをサイドバーに表示します
     * @param {Player} player 
     * @param {string} id 
     */
    static setSidebar(player, id) {
        if(!id || id == "hide") {
            if(Score.scoreboard.getObjectiveAtDisplaySlot("Sidebar"))Score.scoreboard.clearObjectiveAtDisplaySlot("Sidebar");
            player.sendMessage(`§fスコアサイドバーを §7非表示 §fにしました`);
            return;
        }

        if(id == "next") {
            //現在のindexを取得
            const nowId = Score.scoreboard.getObjectiveAtDisplaySlot("Sidebar")?.objective?.id;
            let idx = Object.keys(Score.id).indexOf(nowId);

            if(idx >= Object.keys(Score.id).length - 1)idx = -1;

            id = Object.keys(Score.id)[idx + 1];
        };

        if(!Object.keys(Score.id).includes(id))return player.sendMessage(`§cエラー: スコアIDが見つかりません( > ${id})`);

        Score.scoreboard.setObjectiveAtDisplaySlot("Sidebar", { objective:Score.objectives[id], sortOrder:1, });
        player.sendMessage(`§fスコアサイドバーを §d${Score.list[id]} §fに設定しました`);
    }



}




 