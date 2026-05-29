import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) googleId: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) firstName: string;
  @Column({ nullable: true }) lastName: string;
  @Column({ nullable: true }) avatar: string;
  @Column({ nullable: true }) gender: string;
  @Column({ default: 'CI' }) country: string;
  @Column({ default: 'fr' }) language: string;
  @Column({ default: 'free' }) role: string;
  @Column({ default: 2000 }) credits: number;
  @Column({ default: 'pending' }) subscriptionStatus: string;
  @Column({ nullable: true, unique: true }) referralCode: string;
  @Column({ nullable: true }) referredBy: string;
  @Column({ nullable: true }) magicLinkToken: string;
  @Column({ nullable: true }) magicLinkExpiry: Date;
  @Column({ nullable: true }) refreshToken: string;
  // Nombre de téléchargements gratuits utilisés (abonnés : 1 gratuit puis payant)
  @Column({ default: 0 }) freeDownloadsUsed: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
