import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('ai_prompts')
export class AiPrompt {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) section: string;
  @Column({ type: 'text' }) systemPrompt: string;
  @UpdateDateColumn() updatedAt: Date;
}
