import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Res, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private svc: LibraryService) {}

  @Get() getAll() { return this.svc.getAll(); }
  @Get('admin/books') getAllAdmin() { return this.svc.getAllAdmin(); }
  @Get(':id') getOne(@Param('id') id: string) { return this.svc.getOne(id); }

  /** Télécharger/lire un livre — contrôle crédits ou abonnement */
  @Get(':id/download')
  async download(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.svc.downloadBook(id, req.user);
    if (!result.allowed) {
      throw new ForbiddenException(result.reason ?? 'Crédits insuffisants');
    }
    // Retourner les infos du livre (pdfUrl) pour que le frontend charge le PDF
    return res.json({ pdfUrl: result.pdfUrl, title: result.title, allowed: true, creditsSpent: result.creditsSpent });
  }

  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Patch('admin/books/:id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.svc.updateStatus(id, body.status); }
}
