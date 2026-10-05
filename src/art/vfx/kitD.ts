// Kit-D VFX bundle (KIT_SPELL_IDS_D: riki, clinkz, spectre, muerta). Components live in ./kitD/*.tsx.
import type { VfxBundle } from '../types.ts';
import { BurningArmyVfx, BurningArmyZone, DeathPactVfx, StrafeVfx, TarBombProjectile, TarBombVfx } from './kitD/clinkz.tsx';
import { DeadShotProjectile, DeadShotVfx, GunslingerVfx, PierceTheVeilVfx, TheCallingVfx, TheCallingZone } from './kitD/muerta.tsx';
import { CloakAndDaggerVfx, SmokeScreenVfx, SmokeScreenZone, TricksVfx, TricksZone } from './kitD/riki.tsx';
import { DesolateVfx, DispersionVfx, HauntVfx, SpectralDaggerProjectile, SpectralDaggerVfx } from './kitD/spectre.tsx';

export const kitDVfx: VfxBundle = {
  vfx: {
    smoke_screen: SmokeScreenVfx,
    cloak_and_dagger: CloakAndDaggerVfx,
    tricks_of_the_trade: TricksVfx,
    strafe: StrafeVfx,
    tar_bomb: TarBombVfx,
    death_pact: DeathPactVfx,
    burning_army: BurningArmyVfx,
    spectral_dagger: SpectralDaggerVfx,
    desolate: DesolateVfx,
    dispersion: DispersionVfx,
    haunt: HauntVfx,
    dead_shot: DeadShotVfx,
    the_calling: TheCallingVfx,
    gunslinger: GunslingerVfx,
    pierce_the_veil: PierceTheVeilVfx,
  },
  zones: {
    smoke_screen: SmokeScreenZone,
    tricks_of_the_trade: TricksZone,
    burning_army: BurningArmyZone,
    the_calling: TheCallingZone,
  },
  projectiles: {
    tar_bomb: TarBombProjectile,
    spectral_dagger: SpectralDaggerProjectile,
    dead_shot: DeadShotProjectile,
  },
};
