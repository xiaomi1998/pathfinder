import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/app';
import { logger } from '@/utils/logger';

const router = Router();

// Simple route to get all funnel instances for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const instances = await prisma.funnelInstance.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      include: {
        funnelTemplate: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: instances,
      message: 'Funnel instances retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting funnel instances:', error);
    next(error);
  }
});

// Get funnel instances for a specific template
router.get('/template/:funnelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { funnelId } = req.params;
    
    const instances = await prisma.funnelInstance.findMany({
      where: {
        funnelTemplateId: funnelId,
        userId: req.user.id,
        isActive: true
      },
      include: {
        funnelTemplate: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: instances,
      message: 'Template instances retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting template instances:', error);
    next(error);
  }
});

// Create a new funnel instance from template
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { funnelId, name, description, periodStartDate, periodEndDate, tags, notes } = req.body;

    // Verify the funnel template exists
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      include: { nodes: true }
    });

    if (!funnel) {
      return res.status(404).json({
        success: false,
        error: 'Funnel template not found',
        code: 'FUNNEL_NOT_FOUND'
      });
    }

    // Create funnel instance
    const instance = await prisma.funnelInstance.create({
      data: {
        name,
        description,
        funnelTemplateId: funnelId,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        periodStartDate: periodStartDate ? new Date(periodStartDate) : null,
        periodEndDate: periodEndDate ? new Date(periodEndDate) : null,
        tags: tags || [],
        notes,
        status: 'active',
        isActive: true
      }
    });

    logger.info(`Created funnel instance ${instance.id} from template ${funnelId}`);

    logger.info(`Created funnel instance ${instance.id} from template ${funnelId}`);

    res.status(201).json({
      success: true,
      data: instance,
      message: 'Funnel instance created successfully'
    });
  } catch (error) {
    logger.error('Error creating funnel instance:', error);
    next(error);
  }
});

// Get a specific funnel instance
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { id } = req.params;

    const instance = await prisma.funnelInstance.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        funnelTemplate: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Funnel instance not found',
        code: 'INSTANCE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: instance,
      message: 'Funnel instance retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting funnel instance:', error);
    next(error);
  }
});

// Update a funnel instance
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const instance = await prisma.funnelInstance.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Funnel instance not found',
        code: 'INSTANCE_NOT_FOUND'
      });
    }

    const updatedInstance = await prisma.funnelInstance.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        funnelTemplate: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedInstance,
      message: 'Funnel instance updated successfully'
    });
  } catch (error) {
    logger.error('Error updating funnel instance:', error);
    next(error);
  }
});

// Delete (archive) a funnel instance
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { id } = req.params;

    const instance = await prisma.funnelInstance.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Funnel instance not found',
        code: 'INSTANCE_NOT_FOUND'
      });
    }

    await prisma.funnelInstance.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Funnel instance deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting funnel instance:', error);
    next(error);
  }
});

export default router;