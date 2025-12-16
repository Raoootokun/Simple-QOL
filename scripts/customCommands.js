import { world, system, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, } from "@minecraft/server";
import { log, Util } from "./lib/Util"
import { VERSION } from "./main";
import { Dead } from "./class/Dead";
import { Navigation } from "./class/Navigation";
import { Chunk } from "./class/Chunk";
import { Transfer } from "./class/Transfer";
import { Diff } from "./class/Diff";
import { AutoTool } from "./class/AutoTool";
import { VillagerInv } from "./class/VillagerInv";
import { QuickDrop } from "./class/QuickDrop";
import { DynamicLight } from "./class/DynamicLight";
import { Ikkatu } from "./class/Ikkatu";
import { Score } from "./class/Score";
import { SweepAttack } from "./class/SweepAttack";
import { Setting } from "./class/Setting";
import { AutoFarm } from "./class/AutoFarm";
import { PlayerBOT } from "./class/PlayerBOT";

const PREFIX = "sq";

const COMMAND_LIST = [
    { //version
        command: {
            name: `${PREFIX}:` + "version",
            description: "バージョンを表示します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        alias: [ "v" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                source.sendMessage(`[§bSimple QOL§f] §fver${VERSION.join(".")}`)
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //sweepattack
        command: {
            name: `${PREFIX}:` + "sweepattack",
            description: "範囲攻撃の設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "sweepattack" },
            ],
        },
        alias: [ "sw" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                SweepAttack.set(source, bool, true);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //dead
        command: {
            name: `${PREFIX}:` + "dead",
            description: "死亡情報を表示します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        alias: [ "d" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const index = args[0];
                Dead.showList(source, index)
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //reset
        command: {
            name: `${PREFIX}:` + "reset",
            description: "死亡情報をリセットします",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        alias: [ ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                Dead.reset(source, true);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //navigation
        command: {
            name: `${PREFIX}:` + "navigation",
            description: "座標、プレイヤーをナビゲーションします",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            mandatoryParameters: [
                { type: CustomCommandParamType.Enum, name: "sq:targetType" },
            ],
        },
        alias: [ "n" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const targetType = args[0];

                if(!ENUM_LIST["sq:targetType"].includes(targetType))return source.sendMessage(`§cエラー: targetTypeが存在しません( > ${targetType})`);

                Navigation.set(source, targetType);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //item
        command: {
            name: `${PREFIX}:` + "item",
            description: "アイテムをプレイヤーに渡します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.PlayerSelector, name: "player" },
            ],
        },
        alias: [ "i" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const target = (args[0] == undefined) ? undefined : args[0][0];

                Transfer.item(source, target);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //level
        command: {
            name: `${PREFIX}:` + "level",
            description: "レベルをプレイヤーに渡します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            mandatoryParameters: [
                { type: CustomCommandParamType.Integer, name: "amount" },
            ],
            optionalParameters: [
                { type: CustomCommandParamType.PlayerSelector, name: "player" },
            ],
        },
        alias: [ "l" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const level = args[0];
                const target = (args[1] == undefined) ? undefined : args[1][0];

                Transfer.level(source, level, target);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //chunk
        command: {
            name: `${PREFIX}:` + "chunk",
            description: "チャンク表示を設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "show" },
            ],
        },
        alias: [ "ch" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const show = args[0];
                Chunk.set(source, show, true);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //dif
        command: {
            name: `${PREFIX}:` + "dif",
            description: "難易度を設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Enum, name: "sq:difficulty" },
            ],
        },
        alias: [  ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const difficulty = args[0];
                Diff.set(source, difficulty);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //autotool
        command: {
            name: `${PREFIX}:` + "autotool",
            description: "自動持ち替えを設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "autotool" },
            ],
        },
        alias: [ "at" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const autotool = args[0];
                AutoTool.set(source, autotool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //autofarm
        command: {
            name: `${PREFIX}:` + "autofarm",
            description: "自動植え付けを設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "autofarm" },
            ],
        },
        alias: [ "af" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const autofarm = args[0];
                AutoFarm.set(source, autofarm);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //vinv
        command: {
            name: `${PREFIX}:` + "vinv",
            description: "村人のインベントリ操作を可能にするか設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "vinv" },
            ],
        },
        alias: [  ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                VillagerInv.set(source, bool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //quickdrop
        command: {
            name: `${PREFIX}:` + "quickdrop",
            description: "クイックドロップを設定をします",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "quickdrop" },
            ],
        },
        alias: [ "q" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                QuickDrop.set(source, bool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //dynamiclight
        command: {
            name: `${PREFIX}:` + "dynamiclight",
            description: "ダイナミックライトを設定をします",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "dynamiclight" },
            ],
        },
        alias: [ "dl" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                DynamicLight.set(source, bool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //cutall
        command: {
            name: `${PREFIX}:` + "cutall",
            description: "カットールを設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "cutall" },
            ],
        },
        alias: [ "c" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                Ikkatu.set(source, "cutall", bool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //mineall
        command: {
            name: `${PREFIX}:` + "mineall",
            description: "マインオールを設定します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Boolean, name: "mineall" },
            ],
        },
        alias: [ "m" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const bool = args[0];
                Ikkatu.set(source, "mineall", bool);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //score
        command: {
            name: `${PREFIX}:` + "score",
            description: "スコアを表示します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.PlayerSelector, name: "target" },
            ],
        },
        alias: [ "s" ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const target = (args[0] == undefined) ? undefined : args[0][0];

                Score.showForm(source, target);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //sidebar
        command: {
            name: `${PREFIX}:` + "sidebar",
            description: "スコアをサイドバーに表示します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            optionalParameters: [
                { type: CustomCommandParamType.Enum, name: "sq:scoreId" },
            ],
        },
        alias: [  ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const id = args[0];

                Score.setSidebar(source, id);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //score_reset
        command: {
            name: `${PREFIX}:` + "score_reset",
            description: "スコアをリセットします",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            mandatoryParameters: [
                { type: CustomCommandParamType.PlayerSelector, name: "target" },
            ],
        },
        alias: [ ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;
                const target = args[0][0];

                Score.reset(source, target);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //score_init
        command: {
            name: `${PREFIX}:` + "score_init",
            description: "スコアオブジェクトを初期化します",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
        },
        alias: [ ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;

                Score.init();
                source.sendMessage(`スコアを初期化しました`);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //setting
        command: {
            name: `${PREFIX}:` + "setting",
            description: "各機能の設定をします",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        alias: [ ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;

                Setting.showForm(source);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },

    { //bot
        command: {
            name: `${PREFIX}:` + "bot",
            description: "BOTを召喚・切断します",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        alias: [ ],
        func: function(origin, ...args) {
            system.run(() => {
                const source = origin.sourceEntity;

                PlayerBOT.showForm(source);
            });
            return {
                status: CustomCommandStatus.Success,
            };
        }
    },


];

const ENUM_LIST = {
    "sq:targetType": [ "dead", "player", "cancel" ],
    "sq:difficulty": [ "h", "n", "e", "p" ],
    "sq:scoreId": [ "hide", "next", ...Object.keys(Score.id) ],
};

system.beforeEvents.startup.subscribe(ev => {
    for(const key of Object.keys(ENUM_LIST)) {
        const ENUM = ENUM_LIST[key];
        ev.customCommandRegistry.registerEnum(key, ENUM);
    }

    for(const DATA of COMMAND_LIST) {
        ev.customCommandRegistry.registerCommand(DATA.command, DATA.func);

        if(DATA?.alias?.length > 0) {
            for(const alia of DATA.alias) {
                const commandCopy = JSON.parse(JSON.stringify(DATA.command));
                commandCopy.name = `${PREFIX}:` + alia;

                ev.customCommandRegistry.registerCommand(commandCopy, DATA.func);
            }
            
        }
    }
});