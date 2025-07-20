import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Pokemon } from './pokemon.entity';
import { SearchPokemonDto } from './dto/search-pokemon.dto';
import { PokemonInfoDto } from './dto/pokenmon-info.dto';
import { EvolutionService } from '../evolution/evolution.service';
import { PokemonDetailDto } from './dto/pokemon-detail.dto';
import { EvolutionNodeDto } from './dto/evolution-node.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
    private evolutionService: EvolutionService,
  ) {}

  async findOne(id: number): Promise<PokemonDetailDto> {
    const pokemonInfo = await this.pokemonRepository.findOneBy({ id });
    if (!pokemonInfo) {
      throw new NotFoundException(`Pokemon with index ${id} not found`);
    }

    let evolutionTree: EvolutionNodeDto | null = null;
    if (pokemonInfo.evolutionChainId) {
      evolutionTree = await this.evolutionService.buildEvolutionTree(
        pokemonInfo.evolutionChainId,
      );
    }

    return {
      info: pokemonInfo,
      evolutionTree: evolutionTree,
    };
  }

  async findAll(): Promise<PokemonInfoDto[]> {
    const pokemons = await this.pokemonRepository.find({
      select: ['id', 'name', 'image', 'shinyImage'],
    });
    return pokemons;
  }

  async findByGeneration(generation: number): Promise<PokemonInfoDto[]> {
    const pokemons = await this.pokemonRepository.find({
      select: ['id', 'name', 'image', 'shinyImage'],
      where: { generation },
    });
    return pokemons;
  }

  async search(searchPokemonDto: SearchPokemonDto): Promise<PokemonInfoDto[]> {
    const { generations, searchText } = searchPokemonDto; // 이 부분을 추가했습니다.
    const pokemons = await this.pokemonRepository.find({
      select: ['id', 'name', 'image', 'shinyImage', 'attribute'],
      where: {
        generation: In(generations),
        name: Like(`%${searchText}%`),
      },
    });
    return pokemons;
  }
}
