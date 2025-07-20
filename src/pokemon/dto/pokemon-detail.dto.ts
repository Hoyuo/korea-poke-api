import { Pokemon } from '../pokemon.entity';
import { EvolutionNodeDto } from './evolution-node.dto';

export class PokemonDetailDto {
  info: Pokemon;
  evolutionTree: EvolutionNodeDto | null;
}