import { WorldDatabase, PlayerDatabase } from "./lib/Database"

export const worldDB = new WorldDatabase("world-db");
export const playerDB = new PlayerDatabase("player-db");
export const deadDB = new PlayerDatabase("dead-db");