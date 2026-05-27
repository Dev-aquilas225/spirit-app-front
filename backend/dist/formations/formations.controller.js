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
exports.FormationsController = void 0;
const common_1 = require("@nestjs/common");
const formations_service_1 = require("./formations.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FormationsController = class FormationsController {
    constructor(svc) {
        this.svc = svc;
    }
    getAll() { return this.svc.getAll(); }
    getAllAdmin() { return this.svc.getAllAdmin(); }
    getProgress(req) { return this.svc.getProgress(req.user.id); }
    getOne(id) { return this.svc.getOne(id); }
    getLesson(id, lid) { return this.svc.getLesson(id, lid); }
    addProgress(req, id, body) { return this.svc.addProgress(req.user.id, id, body.lessonId); }
    create(body) { return this.svc.create(body); }
    addLesson(id, body) { return this.svc.addLesson(id, body); }
    update(id, body) { return this.svc.update(id, body); }
    delete(id) { return this.svc.delete(id); }
};
exports.FormationsController = FormationsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getAllAdmin", null);
__decorate([
    (0, common_1.Get)('progress/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(':id/lessons/:lid'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('lid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getLesson", null);
__decorate([
    (0, common_1.Post)(':id/progress'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "addProgress", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/lessons'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "addLesson", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "delete", null);
exports.FormationsController = FormationsController = __decorate([
    (0, common_1.Controller)('formations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [formations_service_1.FormationsService])
], FormationsController);
//# sourceMappingURL=formations.controller.js.map