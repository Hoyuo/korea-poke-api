import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Evolution } from './evolution.entity';
import { Pokemon } from '../pokemon/pokemon.entity';
import { EvolutionNodeDto } from '../pokemon/dto/evolution-node.dto';

@Injectable()
export class EvolutionService {
  constructor(
    @InjectRepository(Evolution)
    private evolutionRepository: Repository<Evolution>,
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  async buildEvolutionTree(
    chainId: number,
  ): Promise<EvolutionNodeDto | null> {
    const pokemonsInChain = await this.pokemonRepository.find({
      where: { evolutionChainId: chainId },
      order: { id: 'ASC' },
    });

    if (pokemonsInChain.length === 0) {
      return null;
    }

    const evolutions = await this.evolutionRepository.find({
      where: { fromPokemonId: In(pokemonsInChain.map((p) => p.id)) },
    });

    const pokemonMap = new Map(pokemonsInChain.map((p) => [p.id, p]));
    const evolutionMap = new Map<number, Evolution[]>();
    evolutions.forEach((evo) => {
      if (!evolutionMap.has(evo.fromPokemonId)) {
        evolutionMap.set(evo.fromPokemonId, []);
      }
      evolutionMap.get(evo.fromPokemonId)!.push(evo);
    });

    const evolvedFromIds = new Set(evolutions.map((e) => e.toPokemonId));
    const rootPokemon = pokemonsInChain.find((p) => !evolvedFromIds.has(p.id));

    if (!rootPokemon) {
      return null; // Should not happen in a valid chain
    }

    return this.buildNode(rootPokemon, pokemonMap, evolutionMap);
  }

  private buildNode(
    currentPokemon: Pokemon,
    pokemonMap: Map<number, Pokemon>,
    evolutionMap: Map<number, Evolution[]>,
    conditions = 'N/A',
  ): EvolutionNodeDto {
    const node = EvolutionNodeDto.fromPokemon(currentPokemon, conditions);
    const nextEvolutions = evolutionMap.get(currentPokemon.id) || [];

    node.evolvesTo = nextEvolutions
      .map((evo) => {
        const nextPokemon = pokemonMap.get(evo.toPokemonId);
        if (nextPokemon) {
          return this.buildNode(
            nextPokemon,
            pokemonMap,
            evolutionMap,
            evo.evolutionConditions,
          );
        }
        return null;
      })
      .filter((n): n is EvolutionNodeDto => n !== null);

    return node;
  }
}