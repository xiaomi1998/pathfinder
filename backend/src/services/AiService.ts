// 重定向到新的Kimi AI服务
import { KimiAiService } from './KimiAiService';

// 直接导出KimiAiService的实例作为AiService
export const AiService = KimiAiService;

// 为了兼容性，同时导出默认实例
import kimiAiService from './KimiAiService';
export default kimiAiService;