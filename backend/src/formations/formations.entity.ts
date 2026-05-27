import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('formations')
export class FormationsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ nullable: true }) coverUrl: string;
  @Column({ default: true }) isActive: boolean;
  @Column({ type: 'json', default: '[]' }) lessons: any[];
  @CreateDateColumn() createdAt: Date;
}
