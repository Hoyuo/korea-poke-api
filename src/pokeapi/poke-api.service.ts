import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Pokemon } from '../pokemon/pokemon.entity';
import { Repository } from 'typeorm';
import { catchError, firstValueFrom, forkJoin, map, of } from 'rxjs';
import { Evolution } from '../evolution/evolution.entity';

interface NameUrlPair {
  name: string;
  url: string;
}

@Injectable()
export class PokeApiService implements OnModuleInit {
  private readonly logger = new Logger(PokeApiService.name);
  private readonly TOTAL_POKEMON_COUNT = 1032;
  private evolutionConditionsMap = new Map<string, string>();

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
    @InjectRepository(Evolution)
    private evolutionRepository: Repository<Evolution>,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking database status for seeding...');
    const count = await this.pokemonRepository.count();
    if (count < this.TOTAL_POKEMON_COUNT) {
      this.logger.log(`DB is incomplete. Starting seeding...`);
      await this.seedDatabase();
    } else {
      this.logger.log(`DB is complete. Skipping seeding.`);
    }
  }

  private async seedDatabase() {
    try {
      this.logger.log('Clearing existing data...');
      await this.evolutionRepository.clear();
      await this.pokemonRepository.clear();

      this.logger.log('Caching all evolution conditions...');
      await this.cacheAllEvolutionConditions();

      this.logger.log(`Fetching all ${this.TOTAL_POKEMON_COUNT} Pokemon...`);
      const response = await firstValueFrom(
        this.httpService.get(
          `https://pokeapi.co/api/v2/pokemon?limit=${this.TOTAL_POKEMON_COUNT}`,
        ),
      );
      const pokemonList: NameUrlPair[] = response.data.results;

      const BATCH_SIZE = 50;
      for (let i = 0; i < pokemonList.length; i += BATCH_SIZE) {
        const batch = pokemonList.slice(i, i + BATCH_SIZE);
        const detailPromises = batch
          .filter((p) => p && p.url)
          .map((p) => this.fetchPokemonDetails(p.url));
        const pokemonDetails = (await Promise.all(detailPromises)).filter(
          (d): d is Partial<Pokemon> => d !== null,
        );
        const entitiesToSave = pokemonDetails.map((detail) =>
          this.pokemonRepository.create(detail),
        );
        if (entitiesToSave.length > 0) {
          await this.pokemonRepository.save(entitiesToSave);
        }
        this.logger.log(
          `Processed ${i + batch.length}/${pokemonList.length} Pokemon...`,
        );
      }
      this.logger.log('DB seeding completed successfully.');
    } catch (error) {
      this.logger.error('Failed to seed database.', error.stack);
    }
  }

  private async fetchPokemonDetails(
    url: string,
  ): Promise<Partial<Pokemon> | null> {
    try {
      const detailRes = await firstValueFrom(this.httpService.get(url));
      const d = detailRes.data;
      const speciesRes = await firstValueFrom(
        this.httpService.get(d.species.url),
      );
      const s = speciesRes.data;

      // 'null' 대신 'undefined'를 사용하도록 수정합니다.
      let evolutionChainId: number | undefined = undefined;
      if (s.evolution_chain?.url) {
        const chainUrlParts = s.evolution_chain.url.split('/');
        const parsedId = parseInt(chainUrlParts[chainUrlParts.length - 2], 10);
        // parseInt가 유효한 숫자를 반환하는지 확인합니다.
        if (!isNaN(parsedId)) {
          evolutionChainId = parsedId;
        }
      }

      if (s.evolves_from_species) {
        const fromSpeciesUrl = s.evolves_from_species.url;
        const fromPokemonId = parseInt(
          fromSpeciesUrl.split('/').slice(-2, -1)[0],
          10,
        );
        const toPokemonId = d.id;
        if (!isNaN(fromPokemonId) && !isNaN(toPokemonId)) {
          const evolutionData = {
            fromPokemonId,
            toPokemonId,
            evolutionConditions:
              this.evolutionConditionsMap.get(
                `${fromPokemonId}-${toPokemonId}`,
              ) || 'N/A',
          };
          await this.evolutionRepository.save(
            this.evolutionRepository.create(evolutionData),
          );
        }
      }

      const types = await this.getKoreanNames(d.types.map((t) => t.type));
      const abilities = await this.getKoreanNames(
        d.abilities.map((a) => a.ability),
      );
      const urlParts = s.generation.url.split('/');
      const generationNumber = parseInt(urlParts[urlParts.length - 2], 10);

      return {
        id: d.id,
        name: this.findKoreanName(s.names),
        status: d.stats.map((stat) => stat.base_stat).join(','),
        classification: this.findKoreanName(s.genera, 'genus'),
        characteristic: abilities.join(','),
        attribute: types.join(','),
        dotImage:
          d.sprites.versions['generation-v']['black-white'].animated
            .front_default,
        dotShinyImage:
          d.sprites.versions['generation-v']['black-white'].animated
            .front_shiny,
        image:
          d.sprites.other['official-artwork'].front_default ||
          d.sprites.front_default,
        shinyImage:
          d.sprites.other['official-artwork'].front_shiny ||
          d.sprites.front_shiny,
        description: this.findKoreanFlavorText(s.flavor_text_entries),
        generation: generationNumber,
        evolutionChainId: evolutionChainId, // 이제 타입 오류가 발생하지 않습니다.
      };
    } catch (error) {
      this.logger.error(`Failed to fetch details from ${url}`, error.message);
      return null;
    }
  }

  // --- 아래 메소드들은 이전과 동일합니다 ---
  private async cacheAllEvolutionConditions() {
    try {
      const listResponse = await firstValueFrom(
        this.httpService.get(
          'https://pokeapi.co/api/v2/evolution-chain?limit=600',
        ),
      );
      const allChains: NameUrlPair[] = listResponse.data.results;
      for (const chain of allChains) {
        this.logger.log( `Processing chain: ${chain.url}`);
        try {
          const response = await firstValueFrom(
            this.httpService.get(chain.url),
          );
          await this.parseChainForCaching(response.data.chain);
        } catch (error) {
          this.logger.error(
            `Failed to process and cache chain ${chain.url}`,
            error,
          );
        }
      }
      this.logger.log('All evolution conditions cached successfully.');
    } catch (error) {
      this.logger.error('Failed to fetch evolution chain list.', error);
    }
  }

  private async parseChainForCaching(chainLink: any) {
    if (!chainLink || !chainLink.evolves_to || chainLink.evolves_to.length === 0)
      return;
    const fromSpeciesUrl = chainLink.species.url;
    const fromPokemonId = parseInt(
      fromSpeciesUrl.split('/').slice(-2, -1)[0],
      10,
    );
    for (const evolution of chainLink.evolves_to) {
      const toSpeciesUrl = evolution.species.url;
      const toPokemonId = parseInt(
        toSpeciesUrl.split('/').slice(-2, -1)[0],
        10,
      );
      if (!isNaN(fromPokemonId) && !isNaN(toPokemonId)) {
        const conditions = await this.formatEvolutionConditions(
          evolution.evolution_details,
        );
        this.evolutionConditionsMap.set(
          `${fromPokemonId}-${toPokemonId}`,
          conditions,
        );
      }
      await this.parseChainForCaching(evolution);
    }
  }

  private async formatEvolutionConditions(details: any[]): Promise<string> {
    if (!details || details.length === 0) return 'N/A';
    const detail = details[0];
    const conditions: string[] = [];
    const trigger = this.findKoreanName(
      (await firstValueFrom(this.httpService.get(detail.trigger.url))).data
        .names,
    );
    if (detail.min_level) conditions.push(`레벨 ${detail.min_level} 이상`);
    if (detail.item) {
      const itemName = this.findKoreanName(
        (await firstValueFrom(this.httpService.get(detail.item.url))).data.names,
      );
      conditions.push(`${itemName} 사용`);
    }
    if (detail.min_happiness)
      conditions.push(`행복도 ${detail.min_happiness} 이상`);
    if (detail.held_item) {
      const heldItemName = this.findKoreanName(
        (await firstValueFrom(this.httpService.get(detail.held_item.url))).data
          .names,
      );
      conditions.push(`${heldItemName}를 지닌 상태`);
    }
    if (detail.time_of_day)
      conditions.push(detail.time_of_day === 'day' ? '낮에' : '밤에');
    if (trigger) conditions.push(trigger);
    return conditions.join(', ');
  }

  private async getKoreanNames(items: NameUrlPair[]): Promise<string[]> {
    const observables = items.map((item) =>
      this.httpService
        .get(item.url)
        .pipe(
          map((res) => this.findKoreanName(res.data.names)),
          catchError(() => of(item.name)),
        ),
    );
    return firstValueFrom(forkJoin(observables));
  }

  private findKoreanName(names: any[], key = 'name'): string {
    const korean = names.find((n) => n.language.name === 'ko');
    return (
      korean?.[key] ||
      names.find((n) => n.language.name === 'en')?.[key] ||
      'N/A'
    );
  }

  private findKoreanFlavorText(entries: any[]): string {
    const koreanEntry = entries.filter((e) => e.language.name === 'ko').pop();
    return koreanEntry ? koreanEntry.flavor_text.replace(/[\n\f]/g, ' ') : '';
  }
}