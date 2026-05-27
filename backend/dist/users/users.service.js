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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(repo) {
        this.repo = repo;
    }
    findById(id) { return this.repo.findOne({ where: { id } }); }
    findByEmail(email) { return this.repo.findOne({ where: { email } }); }
    findByGoogleId(googleId) { return this.repo.findOne({ where: { googleId } }); }
    findByReferralCode(code) { return this.repo.findOne({ where: { referralCode: code } }); }
    findByMagicToken(token) { return this.repo.findOne({ where: { magicLinkToken: token } }); }
    async create(data) {
        const user = this.repo.create({
            ...data,
            credits: 2000,
            role: 'free',
            referralCode: (0, uuid_1.v4)().slice(0, 8).toUpperCase(),
        });
        return this.repo.save(user);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async addCredits(id, amount) {
        await this.repo.increment({ id }, 'credits', amount);
    }
    async deductCredits(id, amount) {
        const user = await this.findById(id);
        if (!user || user.credits < amount)
            return false;
        await this.repo.decrement({ id }, 'credits', amount);
        return true;
    }
    async delete(id) { await this.repo.delete(id); }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map