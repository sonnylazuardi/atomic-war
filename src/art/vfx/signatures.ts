// Signature VFX for the 16 hero signature spells (casts + passive procs share the vfx map).
import type { VfxBundle } from '../types.ts';
import { GlaivesOfWisdom, LagunaBlade, Laser, ThundergodsWrath, BlackHoleCast, BlackHoleZone } from './sig/magic.tsx';
import { CounterHelix, CoupDeGrace, Enrage, EssenceShift, FleshHeap, Omnislash } from './sig/melee.tsx';
import { AssassinateBullet, AssassinateReticle, FreezingFieldCast, FreezingFieldZone, Marksmanship, ShallowGrave, SplitShot } from './sig/ranged.tsx';

export const signatureVfx: VfxBundle = {
  vfx: {
    flesh_heap: FleshHeap,
    counter_helix: CounterHelix,
    enrage: Enrage,
    essence_shift: EssenceShift,
    coup_de_grace: CoupDeGrace,
    omnislash: Omnislash,
    glaives_of_wisdom: GlaivesOfWisdom,
    laguna_blade: LagunaBlade,
    thundergods_wrath: ThundergodsWrath,
    black_hole: BlackHoleCast,
    laser: Laser,
    split_shot: SplitShot,
    marksmanship: Marksmanship,
    assassinate: AssassinateReticle,
    freezing_field: FreezingFieldCast,
    shallow_grave: ShallowGrave,
  },
  zones: { black_hole: BlackHoleZone, freezing_field: FreezingFieldZone },
  projectiles: { assassinate: AssassinateBullet },
};
