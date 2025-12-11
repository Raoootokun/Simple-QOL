import { world, system, Player, Block, ItemStack } from "@minecraft/server";
import { log, Util } from "../lib/Util";
import { Vector } from "../lib/Vector";

export class BlockSit {
    constructor(eventData) {
        /** @type {Player} */ this.player = eventData.player;
        /** @type {ItemStack} */ this.itemStack = eventData.itemStack;
        /** @type {Block} */ this.block = eventData.block;
        /** @type {{ x, y, z }} */ this.pos = Vector.add(eventData.block.location, 0.5);

        /** @type {{}} */ this.eventData = eventData;
    }

    run() {
        if(!this.eventData.isFirstEvent)return;
        //素手かどうか
        if(this.itemStack)return;
        //スニーク中か
        if(!this.player.isSneaking)return;

        if(!this.isSeatableBlock())return;

        this.eventData.cancel = true;

        system.run(() => {
            const seat = this.player.dimension.spawnEntity("sq:seat", this.pos);
            seat.spawnTick = system.currentTick;

            const rideRes = seat.getComponent("rideable").addRider(this.player);
            if(!rideRes)return seat.remove();
            

            const systemNum = system.runInterval(() => {
                //シートが消滅
                if(!seat || !seat.isValid)return system.clearRun(systemNum);

                seat.teleport(this.pos);
            });
        });
    }

    isSeatableBlock() {
        const no = [
            "minecraft:bedrock",
        ];

        return !no.includes(this.block.typeId);
    }

    static checkSeats() {
        if(system.currentTick % 20 != 0)return;

        for(const dimensionId of [ "overworld", "nether", "the_end" ]) {
            const dimension = world.getDimension(dimensionId);

            for(const seat of dimension.getEntities({ type:"sq:seat" })) {
                const rideComp = seat.getComponent("rideable");
                //プレイヤーが乗っているかどうか
                if(rideComp.getRiders().length == 0)seat.remove();
            }
        }
    }

    
    
}