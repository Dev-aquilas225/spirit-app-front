import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private svc: LibraryService) {}
  @Get() getAll() { return this.svc.getAll(); }
  @Get('admin/books') getAllAdmin() { return this.svc.getAllAdmin(); }
  @Get(':id') getOne(@Param('id') id: string) { return this.svc.getOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
  @Patch('admin/books/:id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.svc.updateStatus(id, body.status); }
}
