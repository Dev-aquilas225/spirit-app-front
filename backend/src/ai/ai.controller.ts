import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private svc: AiService) {}

  @Post('chat')
  chat(@Req() req, @Body() body: { message: string; section?: string; conversationId?: string }) {
    return this.svc.chat(req.user.id, body.section || 'ai_chat', body.message, body.conversationId);
  }

  @Post('dreams/interpret')
  interpretDream(@Req() req, @Body() body: { dream: string; conversationId?: string }) {
    return this.svc.interpretDream(req.user.id, body.dream, body.conversationId);
  }

  @Get('conversations')
  getConversations(@Req() req) { return this.svc.getConversations(req.user.id); }

  @Get('conversations/:id')
  getConversation(@Req() req, @Param('id') id: string) { return this.svc.getConversation(req.user.id, id); }

  @Delete('conversations/:id')
  deleteConversation(@Req() req, @Param('id') id: string) { return this.svc.deleteConversation(req.user.id, id); }

  @Get('dreams/history')
  getDreamHistory(@Req() req) { return this.svc.getDreamHistory(req.user.id); }

  @Get('admin/settings')
  getAdminSettings() { return this.svc.getAdminSettings(); }

  @Put('admin/settings/:section')
  updateAdminSettings(@Param('section') section: string, @Body() body: { system_prompt: string }) {
    return this.svc.updateAdminSettings(section, body.system_prompt);
  }
}
