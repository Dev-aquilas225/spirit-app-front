"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AiController = class AiController {
    constructor(svc) {
        this.svc = svc;
    }
    chat(req, body) {
        return this.svc.chat(req.user.id, body.section || 'ai_chat', body.message, body.conversationId);
    }
    interpretDream(req, body) {
        return this.svc.interpretDream(req.user.id, body.dream, body.conversationId);
    }
    getConversations(req) { return this.svc.getConversations(req.user.id); }
    getConversation(req, id) { return this.svc.getConversation(req.user.id, id); }
    deleteConversation(req, id) { return this.svc.deleteConversation(req.user.id, id); }
    getDreamHistory(req) { return this.svc.getDreamHistory(req.user.id); }
    getAdminSettings() { return this.svc.getAdminSettings(); }
    updateAdminSettings(section, body) {
        return this.svc.updateAdminSettings(section, body.system_prompt);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('dreams/interpret'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "interpretDream", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Get)('dreams/history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getDreamHistory", null);
__decorate([
    (0, common_1.Get)('admin/settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getAdminSettings", null);
__decorate([
    (0, common_1.Put)('admin/settings/:section'),
    __param(0, (0, common_1.Param)('section')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "updateAdminSettings", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map