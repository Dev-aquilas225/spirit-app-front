import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('library_books')
export class LibraryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ nullable: true }) author: string;
  @Column({ default: 'Prière' }) category: string;
  @Column({ nullable: true }) coverUrl: string;
  @Column({ default: 100 }) tokenCost: number;
  @Column({ default: 0 }) pages: number;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ nullable: true }) pdfUrl: string;
  @Column({ default: 'active' }) status: string;
  @CreateDateColumn() createdAt: Date;
}
