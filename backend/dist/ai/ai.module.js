"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_conversation_entity_1 = require("./ai-conversation.entity");
const ai_prompt_entity_1 = require("./ai-prompt.entity");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const users_module_1 = require("../users/users.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([ai_conversation_entity_1.AiConversation, ai_prompt_entity_1.AiPrompt]), users_module_1.UsersModule],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService],
        exports: [ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map