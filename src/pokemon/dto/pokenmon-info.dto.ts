import { Pokemon } from '../pokemon.entity';

export class PokemonInfoDto {
  id: number;
  name: string;
  dotImage?: string;
  dotShinyImage?: string;
  attribute?: string;

  static fromEntity(pokemon: Pokemon): PokemonInfoDto {
    const dto = new PokemonInfoDto();
    dto.id = pokemon.id;
    dto.name = pokemon.name;
    dto.dotImage = pokemon.dotImage;
    dto.dotShinyImage = pokemon.dotShinyImage;
    dto.attribute = pokemon.attribute;
    return dto;
  }
}