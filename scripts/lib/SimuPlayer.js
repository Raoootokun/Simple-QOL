import { world, system, } from "@minecraft/server";
import { spawnSimulatedPlayer, } from "@minecraft/server-gametest";
import { WorldLoad } from "./WorldLoad";
import { log } from "./Util";

function spawn(number, pos) {
    let simuPlayer = world.getPlayers({ name:`Player-${number}` })[0];
    if(simuPlayer) {
        simuPlayer.isSimuPlayer = true;
        return simuPlayer;
    }

    simuPlayer = spawnSimulatedPlayer({ dimension:world.getDimension("overworld"), x:pos.x, y:pos.y, z:pos.z }, `Player-${number}`, "Survival");
    simuPlayer.isSimuPlayer = true;
    simuPlayer.addTag("isSimuPlayer");

    return simuPlayer;
}

WorldLoad.subscribe(() => {
    // const a1 = spawn(1, { x:-884, y:66, z:-387 });
    // a1.isSneaking = true;

    // const bP = { x:-882, y:66, z:-387 };
    // a1.lookAtEntity(world.getPlayers({ name:"Raoootokun"})[0])

})