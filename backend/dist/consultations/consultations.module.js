"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const consultations_controller_1 = require("./consultations.controller");
const consultations_service_1 = require("./consultations.service");
const consultations_entity_1 = require("./consultations.entity");
const users_module_1 = require("../users/users.module");
let ConsultationsModule = class ConsultationsModule {
};
exports.ConsultationsModule = ConsultationsModule;
exports.ConsultationsModule = ConsultationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([consultations_entity_1.ConsultationsEntity]), users_module_1.UsersModule],
        controllers: [consultations_controller_1.ConsultationsController],
        providers: [consultations_service_1.ConsultationsService],
        exports: [consultations_service_1.ConsultationsService],
    })
], ConsultationsModule);
//# sourceMappingURL=consultations.module.js.map