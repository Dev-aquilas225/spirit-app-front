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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscriptions_entity_1 = require("./subscriptions.entity");
const users_service_1 = require("../users/users.service");
const axios_1 = require("axios");
const PLANS = [
    { id: 'weekly_plus', name: 'Offre Hebdomadaire', price: 3000, currency: 'XOF', credits: 5000, durationDays: 7 },
    { id: 'monthly', name: 'Offre Mensuelle', price: 8000, currency: 'XOF', credits: 20000, durationDays: 30 },
];
let SubscriptionsService = class SubscriptionsService {
    constructor(repo, users) {
        this.repo = repo;
        this.users = users;
    }
    getPlans() { return PLANS; }
    async initiate(userId, plan, autoRenew = false) {
        const planInfo = PLANS.find(p => p.id === plan);
        if (!planInfo)
            throw new Error('Plan invalide');
        const reference = 'OP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        const sub = this.repo.create({
            userId,
            plan,
            reference,
            status: 'pending',
            autoRenew,
            credits: planInfo.credits,
            amount: planInfo.price,
        });
        await this.repo.save(sub);
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || 'https://oracle-plus.online/subscription/callback';
        if (paystackKey) {
            try {
                const user = await this.users.findById(userId);
                const res = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
                    email: user?.email || 'user@oracle-plus.online',
                    amount: planInfo.price * 100,
                    reference,
                    callback_url: callbackUrl,
                    metadata: { userId, plan, credits: planInfo.credits },
                }, { headers: { Authorization: `Bearer ${paystackKey}` } });
                return { reference, paymentUrl: res.data.data.authorization_url, plan: planInfo };
            }
            catch (e) {
                console.error('[Paystack] initiate error:', e.message);
            }
        }
        return { reference, paymentUrl: null, plan: planInfo };
    }
    async activate(id) {
        const sub = await this.repo.findOne({ where: { id } });
        if (!sub)
            return;
        const planInfo = PLANS.find(p => p.id === sub.plan);
        const durationDays = planInfo?.durationDays ?? 30;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        await this.repo.update(id, { status: 'active', activatedAt: new Date(), expiresAt });
        if (sub.credits)
            await this.users.addCredits(sub.userId, sub.credits);
        await this.users.update(sub.userId, { subscriptionStatus: 'active' });
    }
    async verify(reference) {
        const sub = await this.repo.findOne({ where: { reference } });
        if (!sub)
            return { success: false, verified: false, message: 'Référence introuvable' };
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        if (paystackKey) {
            try {
                const res = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                    headers: { Authorization: `Bearer ${paystackKey}` },
                });
                if (res.data?.data?.status === 'success') {
                    await this.activate(sub.id);
                    const updated = await this.repo.findOne({ where: { id: sub.id } });
                    return { success: true, verified: true, subscription: updated };
                }
            }
            catch (e) {
                console.error('[Paystack] verify error:', e.message);
            }
        }
        return {
            success: sub.status === 'active',
            verified: sub.status === 'active',
            subscription: sub,
        };
    }
    async getStatus(reference) {
        const sub = await this.repo.findOne({ where: { reference } });
        if (!sub)
            return { status: 'pending' };
        return { status: sub.status, subscription: sub };
    }
    getAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscriptions_entity_1.SubscriptionsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map