import { world, system, Player, ItemStack, Block, PlayerDimensionChangeAfterEvent, } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { log, Util } from "../lib/Util";
import { playerDB } from "../database";
import { QOL_Util } from "./QOL_Util";
import { config } from "../config";
import { Vector } from "../lib/Vector";

export class Portal {
    
    
    /**
     * 
     * @param {PlayerDimensionChangeAfterEvent} ev 
     */
    static run({ player, fromDimension, fromLocation, toDimension, toLocation }) {

    }
}


