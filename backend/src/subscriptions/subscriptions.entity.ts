import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('subscriptions')
export class SubscriptionsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column({ default: 'monthly' }) plan: string;
  @Column({ default: 'pending' }) status: string;
  @Column({ nullable: true }) reference: string;
  @Column({ nullable: true }) paystackRef: string;
  @Column({ default: false }) autoRenew: boolean;
  @Column({ nullable: true }) expiresAt: Date;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
