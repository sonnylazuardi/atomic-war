// Shop-spell VFX bundle (the 16 SHOP_SPELL_IDS). Components live in ./shop/*.tsx.
import type { VfxBundle } from '../types.ts';
import { ArcLightningVfx, GlobalSilenceVfx, PurificationVfx, RotVfx, RotZone, TimeLockVfx } from './shop/arcane.tsx';
import { DragonSlaveProjectile, DragonSlaveVfx, LightStrikeVfx, LightStrikeZone } from './shop/fire.tsx';
import { ChainFrostProjectile, ChainFrostVfx, CrystalNovaVfx, FrostbiteVfx } from './shop/frost.tsx';
import {
  BattleHungerVfx,
  BerserkersBloodVfx,
  BlinkStrikeVfx,
  CullingBladeVfx,
  FurySwipesVfx,
  MeatHookProjectile,
  MeatHookVfx,
} from './shop/physical.tsx';

export const shopSpellVfx: VfxBundle = {
  vfx: {
    berserkers_blood: BerserkersBloodVfx,
    global_silence: GlobalSilenceVfx,
    dragon_slave: DragonSlaveVfx,
    light_strike_array: LightStrikeVfx,
    arc_lightning: ArcLightningVfx,
    crystal_nova: CrystalNovaVfx,
    frostbite: FrostbiteVfx,
    purification: PurificationVfx,
    blink_strike: BlinkStrikeVfx,
    battle_hunger: BattleHungerVfx,
    culling_blade: CullingBladeVfx,
    fury_swipes: FurySwipesVfx,
    time_lock: TimeLockVfx,
    rot: RotVfx,
    meat_hook: MeatHookVfx,
    chain_frost: ChainFrostVfx,
  },
  zones: { light_strike_array: LightStrikeZone, rot: RotZone },
  projectiles: { dragon_slave: DragonSlaveProjectile, meat_hook: MeatHookProjectile, chain_frost: ChainFrostProjectile },
};
