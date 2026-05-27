"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrayersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const prayers_controller_1 = require("./prayers.controller");
const prayers_service_1 = require("./prayers.service");
const prayers_entity_1 = require("./prayers.entity");
const users_module_1 = require("../users/users.module");
let PrayersModule = class PrayersModule {
};
exports.PrayersModule = PrayersModule;
exports.PrayersModule = PrayersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([prayers_entity_1.PrayersEntity]), users_module_1.UsersModule],
        controllers: [prayers_controller_1.PrayersController],
        providers: [prayers_service_1.PrayersService],
        exports: [prayers_service_1.PrayersService],
    })
], PrayersModule);
//# sourceMappingURL=prayers.module.js.map