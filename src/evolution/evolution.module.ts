import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evolution } from './evolution.entity';
import { EvolutionService } from './evolution.service';
import { Pokemon } from '../pokemon/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon, Evolution])],
  providers: [EvolutionService],
  exports: [EvolutionService], // 다른 모듈에서 사용 가능하도록 export
})
export class EvolutionModule {}
