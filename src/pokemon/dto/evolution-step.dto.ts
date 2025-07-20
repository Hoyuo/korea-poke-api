import { Evolution } from '../../evolution/evolution.entity';
import { Pokemon } from '../pokemon.entity';

export class EvolutionStepDto {
  fromPokemonId?: number;
  beforeDot?: string;
  beforeShinyDot?: string;
  toPokemonId?: number;
  afterDot?: string;
  afterShinyDot?: string;
  evolutionConditions?: string;

  static fromEvolution(
    evolution: Evolution,
    fromPokemon?: Pokemon,
    toPokemon?: Pokemon,
  ): EvolutionStepDto {
    const dto = new EvolutionStepDto();
    dto.fromPokemonId = evolution.fromPokemonId;
    dto.beforeDot = fromPokemon?.dotImage;
    dto.beforeShinyDot = fromPokemon?.dotShinyImage;
    dto.toPokemonId = evolution.toPokemonId;
    dto.afterDot = toPokemon?.dotImage;
    dto.afterShinyDot = toPokemon?.dotShinyImage;
    dto.evolutionConditions = evolution.evolutionConditions;
    return dto;
  }
}
