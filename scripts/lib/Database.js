import { system, world } from '@minecraft/server';

export class WorldDatabase {
    prefixBase = `WorldDatabase`;
    static prefixBaseStatic = `WorldDatabase`;

    constructor(id) {
        this.map = new Map();

        this.id = id;
        this.prefix = `${this.prefixBase}_${this.id}`;

        this.#load();
    };

    set(key, value) {
        const valueCopy = this.get(key);

        this.map.set(key, value);
        if(this.#save(key, value))return true;

        this.set(key, valueCopy);
        return false;
    };

    delete(key) {
        this.map.delete(key);
        this.#save(key);
    };

    get(key) {
        const value = this.map.get(key);
        if(value == undefined)return;

        return JSON.parse(JSON.stringify(value));
    };

    clear() {
        this.map.clear();
        const ids = world.getDynamicPropertyIds().filter(id => { if(id.startsWith(this.prefix))return id; });

        for(const id of ids) {
           world.setDynamicProperty(id); 
        };
    };

    keys() {
        const keys = [];
        for(const key of this.map.keys()) {
            keys.push(key)
        };
        return keys;
    };

    values() {
        const values = [];
        for(const value of this.map.values()) {
            values.push(value)
        };
        return values;
    };

    entries() {
        const entries = [];
        for(const entry of this.map.entries()) {
            entries.push(entry)
        };
        return entries;
    };

    #save(key, value) {
        const valueStr = JSON.stringify(value);

        try{
            //WorldDatabase-test-key1
            world.setDynamicProperty(this.prefix + `_` + key, valueStr);
        }catch(e){
            return false;
        };
        return true;
    };

    #load() {
        system.run(() => {
            const ids = world.getDynamicPropertyIds().filter(id => { if(id.startsWith(this.prefix))return id; });

            for(const id of ids) {
                const key = id.replace(this.prefix+`_`, ``);
                const valueStr = world.getDynamicProperty(id);
                if(!valueStr)continue;

                const value = JSON.parse(valueStr);
                this.map.set(key, value);
            };
        });
    };

    byte(key) {
        return encodeURI(JSON.stringify(this.map.get(key))).split(/%..|./).length - 1  
    };

    get size() {
        return this.map.size;
    };

};

const playerMap = new Map();
export class PlayerDatabase {
    #prefixBase = `PlayerDatabase`;
    static #prefixBaseStatic = `PlayerDatabase`;

    constructor(id) {
        this.id = id;
        this.prefix = `${this.#prefixBase}_${this.id}`;
    };

    set(player, key, value) {
        const _key_ = this.id + `_` + key;
        playerMap.get(player.id)?.set(_key_, value);
        this.#save(player, _key_, value);
    };

    delete(player, key) {
        playerMap.get(player.id).delete(key);
        this.#save(player, key)
    };

    get(player, key) {
        const _key_ = this.id + `_` + key;
        const _map_ = playerMap?.get(player.id);
        if(!_map_)return; 
        return _map_?.get(_key_);
    };

    has(player, key) {
        const _key_ = this.id + `_` + key;
        const _map_ = playerMap.get(player.id);
        if(!_map_)return; 
        return _map_.has(_key_);
    };

    clear(player) {
        playerMap.get(player.id).clear();
        const ids = player.getDynamicPropertyIds().filter(id => { if(id.startsWith(this.prefix))return id; });
        for(const id of ids) {
            player.setDynamicProperty(id); 
        };
    };

    #save(player, key, value) {
        const valueStr = JSON.stringify(value); 
        player.setDynamicProperty(this.#prefixBase + `_` + key, valueStr);
    };

    static initialSet(player) {
        if(playerMap.has(player.id))return;

        playerMap.set(player.id, new Map());
        
        //DP取得
        const ids = player.getDynamicPropertyIds().filter(id => { if(id.startsWith(this.#prefixBaseStatic))return id; });
        for(const id of ids){
            const valueStr = player.getDynamicProperty(id);
            if(!valueStr)continue;
            
            const key = id.replace(this.#prefixBaseStatic+`_`, ``);
            const value = JSON.parse(valueStr);
            playerMap.get(player.id).set(key, value); 
        };
    };
};
 
world.afterEvents.worldLoad.subscribe(ev => {
    for(const player of world.getPlayers()) {
        PlayerDatabase.initialSet(player);
    };
});

world.afterEvents.playerSpawn.subscribe(ev => {
    const { player, initialSpawn } = ev;
    if(!initialSpawn)return;

    PlayerDatabase.initialSet(player);
});

world.afterEvents.playerLeave.subscribe(ev => {
    const { playerId } = ev;

    playerMap.delete(playerId);
});