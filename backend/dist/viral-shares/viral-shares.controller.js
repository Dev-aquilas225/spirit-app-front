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
exports.ViralSharesController = void 0;
const common_1 = require("@nestjs/common");
const viral_shares_service_1 = require("./viral-shares.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ViralSharesController = class ViralSharesController {
    constructor(svc) {
        this.svc = svc;
    }
    create(req, body) { return this.svc.create(req.user.id, body); }
    getMyShares(req) { return this.svc.getMyShares(req.user.id); }
    getPending() { return this.svc.getPending(); }
    getStats() { return this.svc.getStats(); }
    approve(id) { return this.svc.approve(id); }
    reject(id) { return this.svc.reject(id); }
};
exports.ViralSharesController = ViralSharesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "getMyShares", null);
__decorate([
    (0, common_1.Get)('admin/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('admin/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('admin/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViralSharesController.prototype, "reject", null);
exports.ViralSharesController = ViralSharesController = __decorate([
    (0, common_1.Controller)('viral-shares'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [viral_shares_service_1.ViralSharesService])
], ViralSharesController);
//# sourceMappingURL=viral-shares.controller.js.map