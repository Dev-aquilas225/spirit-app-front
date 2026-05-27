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
const uuid_1 = require("uuid");
const PLANS = [
    { id: 'monthly', name: 'Mensuel', price: 2000, currency: 'XOF', credits: 10000, durationDays: 30 },
    { id: 'yearly', name: 'Annuel', price: 15000, currency: 'XOF', credits: 150000, durationDays: 365 },
];
let SubscriptionsService = class SubscriptionsService {
    constructor(repo, users) {
        this.repo = repo;
        this.users = users;
    }
    getPlans() { return PLANS; }
    async getMySubscription(userId) {
        const sub = await this.repo.findOne({ where: { userId, status: 'active' }, order: { createdAt: 'DESC' } });
        return { isActive: !!sub, subscription: sub };
    }
    async getHistory(userId) {
        return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    }
    async initiate(userId, plan, autoRenew) {
        const user = await this.users.findById(userId);
        const planInfo = PLANS.find(p => p.id === plan) || PLANS[0];
        const reference = `OP-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const sub = await this.repo.save(this.repo.create({ userId, plan, status: 'pending', reference, autoRenew }));
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        if (paystackKey) {
            try {
                const res = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
                    email: user.email,
                    amount: planInfo.price * 100,
                    reference,
                    callback_url: `${process.env.APP_BASE_URL}/subscription/callback`,
                    currency: 'NGN',
                }, { headers: { Authorization: `Bearer ${paystackKey}` } });
                return { reference, paymentUrl: res.data.data.authorization_url, subscriptionId: sub.id };
            }
            catch { }
        }
        return { reference, paymentUrl: `${process.env.APP_BASE_URL}/subscription/callback?reference=${reference}`, subscriptionId: sub.id };
    }
    async verify(reference) {
        const sub = await this.repo.findOne({ where: { reference } });
        if (!sub)
            return { verified: false };
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        if (paystackKey) {
            try {
                const res = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                    headers: { Authorization: `Bearer ${paystackKey}` },
                });
                if (res.data.data.status === 'success') {
                    await this.activate(sub.id);
                    return { verified: true, subscription: sub };
                }
            }
            catch { }
        }
        return { verified: false, subscription: sub };
    }
    async activate(subscriptionId) {
        const sub = await this.repo.findOne({ where: { id: subscriptionId } });
        if (!sub)
            return;
        const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
        const expiresAt = new Date(Date.now() + plan.durationDays * 86400000);
        await this.repo.update(sub.id, { status: 'active', expiresAt });
        await this.users.update(sub.userId, { subscriptionStatus: 'active', role: 'subscriber' });
        await this.users.addCredits(sub.userId, plan.credits);
    }
    async cancel(userId) {
        await this.repo.update({ userId, status: 'active' }, { status: 'cancelled' });
        await this.users.update(userId, { subscriptionStatus: 'cancelled', role: 'free' });
    }
    getAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
    getStatus(reference) { return this.repo.findOne({ where: { reference } }); }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscriptions_entity_1.SubscriptionsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map