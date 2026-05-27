import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('referrals')
export class ReferralsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() referrerId: string;
  @Column() referredId: string;
  @Column({ default: false }) credited: boolean;
  @CreateDateColumn() createdAt: Date;
}
