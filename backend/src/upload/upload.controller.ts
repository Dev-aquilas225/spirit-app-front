/**
 * UploadController — Oracle Plus
 * Routes pour upload d'images et PDF (base64 → fichier sur disque).
 * Servi statiquement via /api/v1/uploads/:file
 */
import { Controller, Post, Get, Param, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = process.env.UPLOADS_PATH || '/tmp/uploads';

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller()
export class UploadController {

  @Post('admin/upload/image')
  @UseGuards(JwtAuthGuard)
  uploadImage(@Body() body: { data: string; name?: string }) {
    ensureDir();
    const { data, name } = body;
    if (!data) return { error: 'No data' };
    const ext = data.includes('image/png') ? 'png' : data.includes('image/webp') ? 'webp' : 'jpg';
    const filename = name || `img_${Date.now()}.${ext}`;
    const b64 = data.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(b64, 'base64'));
    return { url: `/api/v1/uploads/${filename}` };
  }

  @Post('admin/upload/pdf')
  @UseGuards(JwtAuthGuard)
  uploadPdf(@Body() body: { data: string; name?: string }) {
    ensureDir();
    const { data, name } = body;
    if (!data) return { error: 'No data' };
    const filename = name || `doc_${Date.now()}.pdf`;
    const b64 = data.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(b64, 'base64'));
    return { url: `/api/v1/uploads/${filename}` };
  }

  @Get('uploads/:file')
  serveFile(@Param('file') file: string, @Res() res: Response) {
    const filePath = path.join(UPLOAD_DIR, path.basename(file));
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.sendFile(filePath);
  }
}
