import { Router } from 'express';
import { body, param } from 'express-validator';
import { EdgeService } from '@/services/EdgeService';
import { validateRequest } from '@/middleware/validateRequest';
import { CreateEdgeInput } from '@/types/edge';

const router = Router();
const edgeService = new EdgeService();

// 创建连接
router.post(
  '/',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('sourceNodeId')
      .isUUID()
      .withMessage('源节点ID格式无效'),
    
    body('targetNodeId')
      .isUUID()
      .withMessage('目标节点ID格式无效')
      .custom((value, { req }) => {
        if (value === req.body.sourceNodeId) {
          throw new Error('源节点和目标节点不能相同');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const edgeData: CreateEdgeInput = req.body;
      const edge = await edgeService.createEdge(edgeData, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: edge,
        message: '连接创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取连接详情
router.get(
  '/:edgeId',
  [
    param('edgeId')
      .isUUID()
      .withMessage('连接ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const edge = await edgeService.getEdgeById(req.params.edgeId, req.user!.id);
      res.json({
        success: true,
        data: edge
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除连接
router.delete(
  '/:edgeId',
  [
    param('edgeId')
      .isUUID()
      .withMessage('连接ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await edgeService.deleteEdge(req.params.edgeId, req.user!.id);
      res.json({
        success: true,
        message: '连接删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取连接的转化流数据
router.get(
  '/:edgeId/flow',
  [
    param('edgeId')
      .isUUID()
      .withMessage('连接ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const flow = await edgeService.getEdgeConversionFlow(req.params.edgeId, req.user!.id);
      res.json({
        success: true,
        data: flow
      });
    } catch (error) {
      next(error);
    }
  }
);

// 验证连接的有效性
router.post(
  '/validate',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('sourceNodeId')
      .isUUID()
      .withMessage('源节点ID格式无效'),
    
    body('targetNodeId')
      .isUUID()
      .withMessage('目标节点ID格式无效')
      .custom((value, { req }) => {
        if (value === req.body.sourceNodeId) {
          throw new Error('源节点和目标节点不能相同');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, sourceNodeId, targetNodeId } = req.body;
      const validation = await edgeService.validateEdge(
        funnelId, 
        sourceNodeId, 
        targetNodeId, 
        req.user!.id
      );
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      next(error);
    }
  }
);

// 批量创建连接
router.post(
  '/batch',
  [
    body('edges')
      .isArray({ min: 1 })
      .withMessage('连接数组不能为空'),
    
    body('edges.*.funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('edges.*.sourceNodeId')
      .isUUID()
      .withMessage('源节点ID格式无效'),
    
    body('edges.*.targetNodeId')
      .isUUID()
      .withMessage('目标节点ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { edges } = req.body;
      
      // 验证每个连接的源节点和目标节点不相同
      for (const edge of edges) {
        if (edge.sourceNodeId === edge.targetNodeId) {
          return res.status(400).json({
            success: false,
            error: '源节点和目标节点不能相同'
          });
        }
      }
      
      const createdEdges = await edgeService.createBatchEdges(edges, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: createdEdges,
        message: `成功创建 ${createdEdges.length} 个连接`
      });
    } catch (error) {
      next(error);
    }
  }
);

// 批量删除连接
router.delete(
  '/batch',
  [
    body('edgeIds')
      .isArray({ min: 1 })
      .withMessage('连接ID数组不能为空'),
    
    body('edgeIds.*')
      .isUUID()
      .withMessage('连接ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { edgeIds } = req.body;
      await edgeService.deleteBatchEdges(edgeIds, req.user!.id);
      
      res.json({
        success: true,
        message: `成功删除 ${edgeIds.length} 个连接`
      });
    } catch (error) {
      next(error);
    }
  }
);

// 检查循环依赖
router.post(
  '/check-cycle',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId } = req.body;
      const hasCycle = await edgeService.checkForCycles(funnelId, req.user!.id);
      
      res.json({
        success: true,
        data: {
          hasCycle,
          message: hasCycle ? '检测到循环依赖' : '未检测到循环依赖'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;