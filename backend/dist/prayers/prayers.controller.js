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
exports.PrayersController = void 0;
const common_1 = require("@nestjs/common");
const prayers_service_1 = require("./prayers.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PrayersController = class PrayersController {
    constructor(svc) {
        this.svc = svc;
    }
    getDaily() { return this.svc.getDaily(); }
    getDailyByDate(date) { return this.svc.getDailyByDate(date); }
    getAll(req) { return this.svc.getAll(req.user.id); }
    getOne(req, id) { return this.svc.getOne(req.user.id, id); }
    create(req, body) { return this.svc.create(req.user.id, body); }
    getPrograms(req) { return this.svc.getPrograms(req.user.id); }
    createProgram(req, body) { return this.svc.createProgram(req.user.id, body); }
    deleteProgram(req, id) { return this.svc.deleteProgram(req.user.id, id); }
};
exports.PrayersController = PrayersController;
__decorate([
    (0, common_1.Get)('daily'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "getDaily", null);
__decorate([
    (0, common_1.Get)('daily/:date'),
    __param(0, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "getDailyByDate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('programs/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "getPrograms", null);
__decorate([
    (0, common_1.Post)('programs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "createProgram", null);
__decorate([
    (0, common_1.Delete)('programs/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrayersController.prototype, "deleteProgram", null);
exports.PrayersController = PrayersController = __decorate([
    (0, common_1.Controller)('prayers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prayers_service_1.PrayersService])
], PrayersController);
//# sourceMappingURL=prayers.controller.js.map