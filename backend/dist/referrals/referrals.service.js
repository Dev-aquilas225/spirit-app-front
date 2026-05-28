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
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const referrals_entity_1 = require("./referrals.entity");
const users_service_1 = require("../users/users.service");
let ReferralsService = class ReferralsService {
    constructor(repo, users) {
        this.repo = repo;
        this.users = users;
    }
    async getMyReferrals(userId) {
        const user = await this.users.findById(userId);
        const refs = await this.repo.find({ where: { referrerId: userId } });
        const referrals = await Promise.all(refs.map(async (r) => {
            const referee = await this.users.findById(r.referredId);
            return { id: r.id, phone: referee?.email ?? '', joinedAt: r.createdAt, credited: r.credited };
        }));
        return {
            referralCode: user?.referralCode ?? '',
            code: user?.referralCode ?? '',
            count: refs.length,
            referrals,
        };
    }
    async getShareLink(userId) {
        const user = await this.users.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return { code: user.referralCode, referralCode: user.referralCode, message: `Partagez ce code: ${user.referralCode}` };
    }
    async useCode(refereeId, code) {
        if (!code)
            throw new common_1.BadRequestException('Code requis');
        const referrer = await this.users.findByReferralCode(code.toUpperCase());
        if (!referrer)
            throw new common_1.NotFoundException('Code invalide');
        if (referrer.id === refereeId)
            throw new common_1.BadRequestException('Vous ne pouvez pas utiliser votre propre code');
        const existing = await this.repo.findOne({ where: { referredId: refereeId } });
        if (existing)
            throw new common_1.BadRequestException('Vous avez déjà utilisé un code de parrainage');
        await this.repo.save(this.repo.create({ referrerId: referrer.id, referredId: refereeId, credited: true }));
        await this.users.addCredits(referrer.id, 200);
        await this.users.addCredits(refereeId, 200);
        return { success: true, creditsAdded: 200, message: '200 crédits ajoutés à vous et votre parrain !' };
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referrals_entity_1.ReferralsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map