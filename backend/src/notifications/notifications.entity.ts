import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('notifications')
export class NotificationsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) body: string;
  @Column({ default: false }) isRead: boolean;
  @Column({ default: 'info' }) type: string;
  @CreateDateColumn() createdAt: Date;
}
