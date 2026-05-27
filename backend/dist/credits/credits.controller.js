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
exports.CreditsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const users_service_1 = require("../users/users.service");
let CreditsController = class CreditsController {
    constructor(users) {
        this.users = users;
    }
    async getCredits(req) {
        const user = await this.users.findById(req.user.id);
        return { credits: user.credits };
    }
    async deduct(req, body) {
        const ok = await this.users.deductCredits(req.user.id, body.amount);
        if (!ok)
            return { success: false, message: 'Insufficient credits' };
        const user = await this.users.findById(req.user.id);
        return { success: true, credits: user.credits };
    }
    async add(req, body) {
        await this.users.addCredits(req.user.id, body.amount);
        const user = await this.users.findById(req.user.id);
        return { success: true, credits: user.credits };
    }
};
exports.CreditsController = CreditsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getCredits", null);
__decorate([
    (0, common_1.Post)('deduct'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "deduct", null);
__decorate([
    (0, common_1.Post)('add'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "add", null);
exports.CreditsController = CreditsController = __decorate([
    (0, common_1.Controller)('credits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], CreditsController);
//# sourceMappingURL=credits.controller.js.map