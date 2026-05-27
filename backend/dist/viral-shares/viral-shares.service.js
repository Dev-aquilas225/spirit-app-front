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
exports.ViralSharesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const viral_shares_entity_1 = require("./viral-shares.entity");
const users_service_1 = require("../users/users.service");
let ViralSharesService = class ViralSharesService {
    constructor(repo, users) {
        this.repo = repo;
        this.users = users;
    }
    async create(userId, data) {
        const today = new Date().toDateString();
        const todayShares = await this.repo.count({ where: { userId } });
        return this.repo.save(this.repo.create({ ...data, userId, status: 'pending' }));
    }
    getMyShares(userId) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
    getPending() { return this.repo.find({ where: { status: 'pending' }, order: { createdAt: 'DESC' } }); }
    getStats() { return this.repo.count(); }
    async approve(id) {
        const share = await this.repo.findOne({ where: { id } });
        if (!share)
            return;
        await this.repo.update(id, { status: 'approved' });
        await this.users.addCredits(share.userId, 1000);
        return { message: 'Approved, 1000 credits added' };
    }
    async reject(id) {
        await this.repo.update(id, { status: 'rejected' });
        return { message: 'Rejected' };
    }
};
exports.ViralSharesService = ViralSharesService;
exports.ViralSharesService = ViralSharesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(viral_shares_entity_1.ViralSharesEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], ViralSharesService);
//# sourceMappingURL=viral-shares.service.js.map