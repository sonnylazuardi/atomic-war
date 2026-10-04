// Kit-A VFX bundle (KIT_SPELL_IDS_A). Components live in ./kitA/*.tsx.
import type { VfxBundle } from '../types.ts';
import { ArcaneCurseVfx, FierySoulVfx, LastWordVfx } from './kitA/arcane.tsx';
import {
  BerserkersCallVfx,
  BladeDanceVfx,
  BladeFuryVfx,
  BladeFuryZone,
  DismemberVfx,
  DismemberZone,
  EarthshockVfx,
  HealingWardVfx,
  HealingWardZone,
  OverpowerVfx,
} from './kitA/brutes.tsx';
import {
  BlurVfx,
  DarkPactVfx,
  DarkPactZone,
  PhantomStrikeVfx,
  PounceVfx,
  ShadowDanceVfx,
  StiflingDaggerProjectile,
  StiflingDaggerVfx,
} from './kitA/rogues.tsx';

export const kitAVfx: VfxBundle = {
  vfx: {
    dismember: DismemberVfx,
    berserkers_call: BerserkersCallVfx,
    earthshock: EarthshockVfx,
    overpower: OverpowerVfx,
    dark_pact: DarkPactVfx,
    pounce: PounceVfx,
    shadow_dance: ShadowDanceVfx,
    stifling_dagger: StiflingDaggerVfx,
    phantom_strike: PhantomStrikeVfx,
    blur: BlurVfx,
    blade_fury: BladeFuryVfx,
    healing_ward: HealingWardVfx,
    blade_dance: BladeDanceVfx,
    arcane_curse: ArcaneCurseVfx,
    last_word: LastWordVfx,
    fiery_soul: FierySoulVfx,
  },
  zones: { dismember: DismemberZone, blade_fury: BladeFuryZone, healing_ward: HealingWardZone, dark_pact: DarkPactZone },
  projectiles: { stifling_dagger: StiflingDaggerProjectile },
};
