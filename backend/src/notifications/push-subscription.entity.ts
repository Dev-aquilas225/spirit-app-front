import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) userId: string;
  @Column({ type: 'text' }) endpoint: string;
  @Column({ type: 'text', nullable: true }) p256dh: string;
  @Column({ type: 'text', nullable: true }) auth: string;
  @CreateDateColumn() createdAt: Date;
}
