import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('prayers')
export class PrayersEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column({ default: 'morning' }) type: string;
  @Column({ type: 'text' }) content: string;
  @Column({ nullable: true }) date: string;
  @CreateDateColumn() createdAt: Date;
}
