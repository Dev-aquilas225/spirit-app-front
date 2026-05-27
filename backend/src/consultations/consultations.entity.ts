import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('consultations')
export class ConsultationsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column({ type: 'text' }) question: string;
  @Column({ type: 'text', nullable: true }) response: string;
  @Column({ default: 'pending' }) status: string;
  @CreateDateColumn() createdAt: Date;
}
