import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokeApiService } from './poke-api.service';
import { Pokemon } from '../pokemon/pokemon.entity';
import { Evolution } from '../evolution/evolution.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 요청 시간이 길어질 수 있으므로 타임아웃을 10초로 설정
      maxRedirects: 5,
    }),
    TypeOrmModule.forFeature([Pokemon, Evolution]),
  ],
  providers: [PokeApiService],
})
export class PokeApiModule {}
