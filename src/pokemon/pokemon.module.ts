import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pokemon } from './pokemon.entity';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon]), EvolutionModule],
  providers: [PokemonService],
  controllers: [PokemonController],
})
export class PokemonModule {}
