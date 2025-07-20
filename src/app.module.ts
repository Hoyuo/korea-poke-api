import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { PokeApiModule } from './pokeapi/poke-api.module';
import { EvolutionModule } from './evolution/evolution.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database:
        process.env.NODE_ENV === 'production'
          ? join('/data', 'sqlite.db')
          : join(__dirname, '..', 'sqlite.db'),
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: true,
      autoLoadEntities: true,
    }),
    PokemonModule,
    PokeApiModule,
    EvolutionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
