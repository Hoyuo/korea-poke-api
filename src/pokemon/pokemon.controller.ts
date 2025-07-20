import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { SearchPokemonDto } from './dto/search-pokemon.dto';
import { PokemonInfoDto } from './dto/pokenmon-info.dto';
import { PokemonDetailDto } from './dto/pokemon-detail.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  findAll(): Promise<PokemonInfoDto[]> {
    return this.pokemonService.findAll();
  }

  @Get('generation/:generation')
  findByGeneration(
    @Param('generation') generation: number,
  ): Promise<PokemonInfoDto[]> {
    return this.pokemonService.findByGeneration(generation);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<PokemonDetailDto> {
    return this.pokemonService.findOne(id);
  }

  @Post('search')
  search(
    @Body() searchPokemonDto: SearchPokemonDto,
  ): Promise<PokemonInfoDto[]> {
    return this.pokemonService.search(searchPokemonDto);
  }
}
