import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('evolution')
export class Evolution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fromPokemonId: number;

  @Column()
  toPokemonId: number;

  @Column({ length: 100, nullable: true })
  evolutionConditions: string;
}
