import { world, system, InputButton, ButtonState, Seat,  } from "@minecraft/server";
import { log, Util } from "./lib/Util";
import { Dead } from "./class/Dead";
import { Spawn } from "./class/Spawn";
import { SweepAttack } from "./class/SweepAttack";
import { AutoTool } from "./class/AutoTool";
import { VillagerInv } from "./class/VillagerInv";
import { QuickDrop } from "./class/QuickDrop";
import { Ikkatu } from "./class/Ikkatu";
import { Score } from "./class/Score";
import { AutoFarm } from "./class/AutoFarm";
import { Item } from "./class/Item";
import { BlockSit } from "./class/BlockSit";
import { PlayerBOT } from "./class/PlayerBOT";


//playerSpawn
world.afterEvents.playerSpawn.subscribe(ev => {
    const { player, initialSpawn } = ev;
    if(PlayerBOT.isBOT(player))return;

    Spawn.run(player);

    Score.runJoin(player);
});


//playerSwingStart
world.afterEvents.playerSwingStart.subscribe(ev => {
    const { player, heldItemStack, swingSource } = ev;
    if(PlayerBOT.isBOT(player))return;

    if(swingSource == "Attack" || swingSource == "Mine") {
        const swepAttc = new SweepAttack(player, heldItemStack);
        swepAttc.run();
    };
});


//playerInteractWithEntity
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
    const { player, target, itemStack, } = ev;
    if(PlayerBOT.isBOT(player))return;
    if(PlayerBOT.isBOT(target))return ev.cancel = true;

    VillagerInv.initRun(ev);
    Score.runInteract(player, target);
});


//playerInteractWithBlock
world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const { player, itemStack, block, blockFace, faceLocation, isFirstEvent } = ev;
    if(PlayerBOT.isBOT(player))return;
    // if(!isFirstEvent)return;

    const autoFarm = new AutoFarm(player, itemStack, block, ev);
    autoFarm.run();

    const seat = new BlockSit(ev);
    seat.run();
})


//playerBreakBlock
world.beforeEvents.playerBreakBlock.subscribe(ev => {
    const { player, itemStack, block, dimension } = ev;
    if(PlayerBOT.isBOT(player))return;

    const ikkatu = new Ikkatu(player, itemStack, block);
    ikkatu.run();

    Score.runBreakBlock(player, block);
});


world.afterEvents.playerPlaceBlock.subscribe(ev => {
    const { player, block, dimension } = ev;
    if(PlayerBOT.isBOT(player))return;

    Score.runPlaceBlock(player, block);
});


//itemUse
world.afterEvents.itemUse.subscribe(ev => {
    const { source, itemStack } = ev;

    Ikkatu.showSettingForm(source);
});


//entityHitBlock
world.afterEvents.entityHitBlock.subscribe(ev => {
    const { hitBlock, hitBlockPermutation, damagingEntity, blockFace } = ev;
    if(PlayerBOT.isBOT(damagingEntity))return;

    AutoTool.run(damagingEntity, hitBlock);
});


//entityHitEntity
world.afterEvents.entityHitEntity.subscribe(ev => {
    const { hitEntity, damagingEntity, } = ev;

    QuickDrop.run(damagingEntity, hitEntity);
});


//entityHurt
world.afterEvents.entityHurt.subscribe(ev => {
    const { hurtEntity, damage, damageSource: { damagingEntity, damagingProjectile, cause }} = ev;

    Score.runHurt(hurtEntity, damagingEntity, damage);

    PlayerBOT.hurt(hurtEntity);
});


//entityDie
world.afterEvents.entityDie.subscribe(ev => {
    const { deadEntity, damageSource: { damagingEntity, damagingProjectile, cause }, } = ev;
    if(PlayerBOT.isBOT(deadEntity))return;

    const dead = new Dead(deadEntity, damagingEntity, cause);
    dead.run();

    Score.runDie(deadEntity, damagingEntity, damagingProjectile, cause);
});


//entitySpawn
world.afterEvents.entitySpawn.subscribe(ev => {
    const { entity, cause } = ev;
    if(PlayerBOT.isBOT(entity))return;

    if(entity.typeId == "minecraft:item")Item.spawn(entity);
})