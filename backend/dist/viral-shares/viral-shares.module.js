"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViralSharesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const viral_shares_controller_1 = require("./viral-shares.controller");
const viral_shares_service_1 = require("./viral-shares.service");
const viral_shares_entity_1 = require("./viral-shares.entity");
const users_module_1 = require("../users/users.module");
let ViralSharesModule = class ViralSharesModule {
};
exports.ViralSharesModule = ViralSharesModule;
exports.ViralSharesModule = ViralSharesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([viral_shares_entity_1.ViralSharesEntity]), users_module_1.UsersModule],
        controllers: [viral_shares_controller_1.ViralSharesController],
        providers: [viral_shares_service_1.ViralSharesService],
        exports: [viral_shares_service_1.ViralSharesService],
    })
], ViralSharesModule);
//# sourceMappingURL=viral-shares.module.js.map