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
exports.PrayersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const prayers_entity_1 = require("./prayers.entity");
const MORNING = 'Seigneur, en ce nouveau matin, je Te rends grâce pour la vie. Guide mes pas aujourd\'hui et que Ta volonté soit faite. Amen.';
const EVENING = 'Père céleste, merci pour cette journée. Protège-moi cette nuit et renouvelle mes forces. Amen.';
let PrayersService = class PrayersService {
    constructor(repo) {
        this.repo = repo;
    }
    getDaily() { return { morning: { type: 'morning', content: MORNING }, evening: { type: 'evening', content: EVENING } }; }
    getDailyByDate(date) { return { morning: { type: 'morning', content: MORNING, date }, evening: { type: 'evening', content: EVENING, date } }; }
    getAll(userId) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
    getOne(userId, id) { return this.repo.findOne({ where: { id, userId } }); }
    async create(userId, data) { return this.repo.save(this.repo.create({ ...data, userId })); }
    getPrograms(userId) { return this.repo.find({ where: { userId, type: 'program' }, order: { createdAt: 'DESC' } }); }
    async createProgram(userId, data) { return this.repo.save(this.repo.create({ ...data, userId, type: 'program' })); }
    async deleteProgram(userId, id) { await this.repo.delete({ id, userId }); }
};
exports.PrayersService = PrayersService;
exports.PrayersService = PrayersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prayers_entity_1.PrayersEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PrayersService);
//# sourceMappingURL=prayers.service.js.map