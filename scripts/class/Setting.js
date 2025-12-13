import { world, system, Player, ItemStack, Block, } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { SweepAttack } from "./SweepAttack";
import { Ikkatu } from "./Ikkatu";
import { AutoTool } from "./AutoTool";
import { QuickDrop } from "./QuickDrop";
import { DynamicLight } from "./DynamicLight";
import { Chunk } from "./Chunk";
import { VillagerInv } from "./VillagerInv";
import { ModalFormData } from "@minecraft/server-ui";
import { AutoFarm } from "./AutoFarm";

export class Setting {


    /**
     * 設定フォームを開く
     * @param {Player} player 
     */
    static showForm(player) {
        const sweepAttack = SweepAttack.get(player);
        const mineall = Ikkatu.get(player, "mineall");
        const cutall = Ikkatu.get(player, "cutall");
        const autotool = AutoTool.get(player);
        const autofarm = AutoFarm.get(player);
        const quickdrop = QuickDrop.get(player);
        const dynamiclight = DynamicLight.get(player);
        const chunk = Chunk.get(player);
        const vinv = VillagerInv.get(player);

        const form = new ModalFormData();
        form.title(`設定`);

        form.toggle(`範囲攻撃`, { defaultValue:sweepAttack, });
        form.toggle(`マインオール`, { defaultValue:mineall, });
        form.toggle(`カットオール`, { defaultValue:cutall, });
        form.toggle(`自動持ち替え`, { defaultValue:autotool, });
        form.toggle(`自動植え付け`, { defaultValue:autofarm, });
        form.toggle(`クイックドロップ`, { defaultValue:quickdrop, });
        form.toggle(`ダイナミックライト`, { defaultValue:dynamiclight, });
        form.toggle(`チャンク表示`, { defaultValue:chunk, });
        form.toggle(`村人のインベントリ操作`, { defaultValue:vinv, });

        form.submitButton(`保存`);
        form.show(player).then(res => {
            if(res.canceled)return;

            if(sweepAttack != res.formValues[0])SweepAttack.set(player, res.formValues[0]);
            if(mineall != res.formValues[1])Ikkatu.set(player, "mineall", res.formValues[1]);
            if(cutall != res.formValues[2])Ikkatu.set(player, "cutall", res.formValues[2]);
            if(autotool != res.formValues[3])AutoTool.set(player, res.formValues[3]);
            if(autofarm != res.formValues[4])AutoFarm.set(player, res.formValues[4]);
            if(quickdrop != res.formValues[5])QuickDrop.set(player, res.formValues[5]);
            if(dynamiclight != res.formValues[6])DynamicLight.set(player, res.formValues[6]);
            if(chunk != res.formValues[7])Chunk.set(player, res.formValues[7]);
            if(vinv != res.formValues[8])VillagerInv.set(player, res.formValues[8]);
        });
    }
}