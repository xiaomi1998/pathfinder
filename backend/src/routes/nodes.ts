import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { NodeService } from '@/services/NodeService';
import { validateRequest } from '@/middleware/validateRequest';
import { CreateNodeInput, UpdateNodeInput, CreateNodeDataInput, UpdateNodeDataInput } from '@/types/node';

const router = Router();
const nodeService = new NodeService();

// 创建节点
router.post(
  '/',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('nodeType')
      .isIn(['awareness', 'acquisition', 'activation', 'revenue', 'retention'])
      .withMessage('节点类型无效'),
    
    body('label')
      .isLength({ min: 1, max: 30 })
      .withMessage('节点标签长度必须在1-30个字符之间'),
    
    body('positionX')
      .isNumeric()
      .withMessage('X坐标必须是数字'),
    
    body('positionY')
      .isNumeric()
      .withMessage('Y坐标必须是数字')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const nodeData: CreateNodeInput = req.body;
      const node = await nodeService.createNode(nodeData, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: node,
        message: '节点创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取节点详情
router.get(
  '/:nodeId',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const node = await nodeService.getNodeById(req.params.nodeId, req.user!.id);
      res.json({
        success: true,
        data: node
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新节点
router.put(
  '/:nodeId',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    body('label')
      .optional()
      .isLength({ min: 1, max: 30 })
      .withMessage('节点标签长度必须在1-30个字符之间'),
    
    body('positionX')
      .optional()
      .isNumeric()
      .withMessage('X坐标必须是数字'),
    
    body('positionY')
      .optional()
      .isNumeric()
      .withMessage('Y坐标必须是数字')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const updateData: UpdateNodeInput = req.body;
      const node = await nodeService.updateNode(req.params.nodeId, updateData, req.user!.id);
      
      res.json({
        success: true,
        data: node,
        message: '节点更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除节点
router.delete(
  '/:nodeId',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await nodeService.deleteNode(req.params.nodeId, req.user!.id);
      res.json({
        success: true,
        message: '节点删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取节点数据（按周）
router.get(
  '/:nodeId/data',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页条数必须在1-100之间')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const nodeData = await nodeService.getNodeData(req.params.nodeId, req.user!.id, {
        startDate,
        endDate,
        page,
        limit
      });
      
      res.json({
        success: true,
        data: nodeData
      });
    } catch (error) {
      next(error);
    }
  }
);

// 添加节点数据
router.post(
  '/:nodeId/data',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    body('weekStartDate')
      .isISO8601()
      .withMessage('周开始日期格式无效'),
    
    body('entryCount')
      .isInt({ min: 0 })
      .withMessage('进入数量必须是非负整数'),
    
    body('convertedCount')
      .isInt({ min: 0 })
      .withMessage('转化数量必须是非负整数')
      .custom((value, { req }) => {
        if (value > req.body.entryCount) {
          throw new Error('转化数量不能大于进入数量');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const nodeDataInput: CreateNodeDataInput = {
        nodeId: req.params.nodeId,
        ...req.body
      };
      
      const nodeData = await nodeService.createNodeData(nodeDataInput, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: nodeData,
        message: '节点数据添加成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新节点数据
router.put(
  '/:nodeId/data/:dataId',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    param('dataId')
      .isUUID()
      .withMessage('数据ID格式无效'),
    
    body('entryCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('进入数量必须是非负整数'),
    
    body('convertedCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('转化数量必须是非负整数')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const updateData: UpdateNodeDataInput = req.body;
      
      // 验证转化数量不能大于进入数量
      if (updateData.convertedCount !== undefined && updateData.entryCount !== undefined) {
        if (updateData.convertedCount > updateData.entryCount) {
          return res.status(400).json({
            success: false,
            error: '转化数量不能大于进入数量'
          });
        }
      }
      
      const nodeData = await nodeService.updateNodeData(
        req.params.nodeId,
        req.params.dataId,
        updateData,
        req.user!.id
      );
      
      res.json({
        success: true,
        data: nodeData,
        message: '节点数据更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除节点数据
router.delete(
  '/:nodeId/data/:dataId',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    param('dataId')
      .isUUID()
      .withMessage('数据ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await nodeService.deleteNodeData(req.params.nodeId, req.params.dataId, req.user!.id);
      res.json({
        success: true,
        message: '节点数据删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取节点统计信息
router.get(
  '/:nodeId/stats',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const stats = await nodeService.getNodeStats(req.params.nodeId, req.user!.id);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取节点性能趋势
router.get(
  '/:nodeId/trends',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    query('weeks')
      .optional()
      .isInt({ min: 1, max: 52 })
      .withMessage('周数必须在1-52之间')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const weeks = parseInt(req.query.weeks as string) || 12;
      const trends = await nodeService.getNodeTrends(req.params.nodeId, weeks, req.user!.id);
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  }
);

// 批量更新节点位置
router.put(
  '/positions',
  [
    body('nodes')
      .isArray({ min: 1 })
      .withMessage('节点数组不能为空'),
    
    body('nodes.*.id')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    body('nodes.*.positionX')
      .isNumeric()
      .withMessage('X坐标必须是数字'),
    
    body('nodes.*.positionY')
      .isNumeric()
      .withMessage('Y坐标必须是数字')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { nodes } = req.body;
      const updatedNodes = await nodeService.updateNodePositions(nodes, req.user!.id);
      
      res.json({
        success: true,
        data: updatedNodes,
        message: '节点位置更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;