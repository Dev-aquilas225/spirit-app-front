import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryEntity } from './library.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryEntity) private repo: Repository<LibraryEntity>,
    private users: UsersService,
  ) {}

  getAll() { return this.repo.find({ where: { status: "active" }, order: { createdAt: "DESC" } }); }
  getAllAdmin() { return this.repo.find({ order: { createdAt: "DESC" } }); }
  getOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: any) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: any) { await this.repo.update(id, data); return this.getOne(id); }
  async delete(id: string) { await this.repo.delete(id); }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.getOne(id); }

  /**
   * Contrôle d accès au téléchargement d un livre :
   * - Abonné actif : 1 téléchargement gratuit, puis tokenCost crédits
   * - Non-abonné : tokenCost crédits requis
   */
  async downloadBook(bookId: string, userPayload: { userId: string }) {
    const book = await this.repo.findOne({ where: { id: bookId } });
    if (!book) throw new NotFoundException("Livre introuvable");

    const user = await this.users.findById(userPayload.userId);
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const isSubscribed = user.subscriptionStatus === "active";
    const freeUsed = user.freeDownloadsUsed ?? 0;

    // Abonné avec téléchargement gratuit disponible
    if (isSubscribed && freeUsed === 0) {
      await this.users.update(user.id, { freeDownloadsUsed: 1 });
      return { allowed: true, pdfUrl: book.pdfUrl, title: book.title, creditsSpent: 0 };
    }

    // Vérifier les crédits
    const cost = book.tokenCost ?? 100;
    if (user.credits < cost) {
      return { allowed: false, reason: "Crédits insuffisants. Il vous faut " + cost + " crédits pour télécharger ce livre." };
    }

    // Déduire les crédits
    await this.users.update(user.id, { credits: user.credits - cost });
    return { allowed: true, pdfUrl: book.pdfUrl, title: book.title, creditsSpent: cost };
  }
}
