import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pokemon')
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45, nullable: true })
  name: string;

  @Column({ length: 45, nullable: true })
  status: string;

  @Column({ length: 45, nullable: true })
  classification: string;

  @Column({ length: 45, nullable: true })
  characteristic: string;

  @Column({ length: 45, nullable: true })
  attribute: string;

  @Column({ length: 500, nullable: true })
  dotImage: string;

  @Column({ length: 500, nullable: true })
  dotShinyImage: string;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ length: 500, nullable: true })
  shinyImage: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ nullable: true })
  generation: number;

  @Column({ nullable: true, comment: '진화 사슬 ID' })
  evolutionChainId: number;
}
