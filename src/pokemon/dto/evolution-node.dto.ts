import { PokemonInfoDto } from './pokenmon-info.dto';
import { Pokemon } from '../pokemon.entity';

export class EvolutionNodeDto {
  pokemon: PokemonInfoDto;
  evolutionConditions: string;
  evolvesTo?: EvolutionNodeDto[];

  static fromPokemon(pokemon: Pokemon, conditions = 'N/A'): EvolutionNodeDto {
    const node = new EvolutionNodeDto();
    node.pokemon = PokemonInfoDto.fromEntity(pokemon);
    node.evolutionConditions = conditions;
    node.evolvesTo = [];
    return node;
  }
}
