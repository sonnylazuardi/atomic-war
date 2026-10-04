// Kit-B VFX bundle (KIT_SPELL_IDS_B: Zeus, Enigma, Tinker, Medusa, Drow Ranger kits). Components in ./kitB/*.tsx.
import type { VfxBundle } from '../types.ts';
import { FrostArrowsVfx, GustProjectile, GustVfx, MultishotVfx, MultishotZone } from './kitB/frost.tsx';
import { ManaShieldVfx, MysticSnakeVfx, StoneGazeVfx, StoneGazeZone } from './kitB/gorgon.tsx';
import { DemonicConversionVfx, LightningBoltVfx, MaleficeVfx, MidnightPulseVfx, MidnightPulseZone, StaticFieldVfx } from './kitB/storm.tsx';
import { DefenseMatrixVfx, HeatSeekingMissileProjectile, HeatSeekingMissileVfx, RearmVfx } from './kitB/tech.tsx';

export const kitBVfx: VfxBundle = {
  vfx: {
    lightning_bolt: LightningBoltVfx,
    static_field: StaticFieldVfx,
    malefice: MaleficeVfx,
    demonic_conversion: DemonicConversionVfx,
    midnight_pulse: MidnightPulseVfx,
    heat_seeking_missile: HeatSeekingMissileVfx,
    defense_matrix: DefenseMatrixVfx,
    rearm: RearmVfx,
    mystic_snake: MysticSnakeVfx,
    mana_shield: ManaShieldVfx,
    stone_gaze: StoneGazeVfx,
    frost_arrows: FrostArrowsVfx,
    gust: GustVfx,
    multishot: MultishotVfx,
  },
  zones: { midnight_pulse: MidnightPulseZone, stone_gaze: StoneGazeZone, multishot: MultishotZone },
  projectiles: { heat_seeking_missile: HeatSeekingMissileProjectile, gust: GustProjectile },
};
