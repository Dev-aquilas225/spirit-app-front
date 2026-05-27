import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('viral_shares')
export class ViralSharesEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column({ nullable: true }) contactsCount: number;
  @Column({ default: 'pending' }) status: string;
  @Column({ nullable: true }) screenshotUrl: string;
  @CreateDateColumn() createdAt: Date;
}
