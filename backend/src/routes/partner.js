import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Order, AuditLog } from '../models/index.js';
import logger from '../config/logger.js';

const router = Router();

// Helper to resolve order by ObjectId, TSK-taskId, or orderId/orderNumber
async function findOrderByIdOrTaskId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Order.findById(id);
  }
  if (id.startsWith('TSK-')) {
    const suffix = id.replace('TSK-', '').toLowerCase();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    return orders.find((o) => o._id.toString().toLowerCase().endsWith(suffix)) || null;
  }
  return Order.findOne({ $or: [{ orderId: id }, { orderNumber: id }] });
}

// All partner routes require authentication and partner or admin role
router.use(requireAuth);
router.use(requireRole('partner', 'admin'));

/**
 * GET /api/v1/partner/tasks
 * List field engineering / installation tasks for the partner.
 */
router.get('/tasks', async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('quoteId')
      .populate('userId', 'phoneLast4 language role');

    const tasks = orders.map((o) => ({
      taskId: `TSK-${o._id.toString().slice(-8).toUpperCase()}`,
      orderId: o._id,
      orderNumber: o.orderId || o.orderNumber || `ORD-${o._id.toString().slice(-6).toUpperCase()}`,
      status: o.status,
      customerPhone: o.userId ? `•••• ••${o.userId.phoneLast4 || '8888'}` : '•••• ••••',
      scheduledSlot: o.selectedSlot?.timeWindow
        ? `${new Date(o.selectedSlot.slotDate).toLocaleDateString()} (${o.selectedSlot.timeWindow})`
        : (o.scheduledSlot || 'Pending Slot Selection'),
      siteAddress: o.installationAddress || 'Principal Place of Business',
      telemetry: o.telemetry || {
        opticalSignalDbm: -19.2,
        lightLossDb: 0.8,
        snrDb: 34.5,
      },
      updatedAt: o.updatedAt,
      createdAt: o.createdAt,
    }));

    res.json({
      ok: true,
      data: {
        tasks,
        total: tasks.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/partner/tasks/:id
 * Fetch task details by orderId or taskId.
 */
router.get('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let order = await findOrderByIdOrTaskId(id);
    if (order) {
      order = await Order.findById(order._id).populate('quoteId').populate('userId', 'phoneLast4 language');
    }

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Partner task or installation order not found',
        },
      });
    }

    res.json({
      ok: true,
      data: {
        task: {
          taskId: `TSK-${order._id.toString().slice(-8).toUpperCase()}`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerPhone: order.userId ? `•••• ••${order.userId.phoneLast4}` : '•••• ••••',
          scheduledSlot: order.scheduledSlot,
          siteAddress: order.installationAddress || 'Principal Place of Business',
          telemetry: order.telemetry || {
            opticalSignalDbm: -19.2,
            lightLossDb: 0.8,
            snrDb: 34.5,
          },
          history: order.history || [],
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/partner/tasks/:id
 * Update installation progress, optical dBm reading, and technician notes.
 */
router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, opticalSignalDbm, technicianNotes } = req.body;

    const order = await findOrderByIdOrTaskId(id);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Partner task or installation order not found',
        },
      });
    }

    if (status) {
      order.status = status;
    }

    if (!order.telemetry) {
      order.telemetry = {};
    }
    if (typeof opticalSignalDbm === 'number') {
      order.telemetry.opticalSignalDbm = opticalSignalDbm;
    }
    if (technicianNotes) {
      order.telemetry.lastTechnicianNote = technicianNotes;
    }
    order.telemetry.lastUpdated = new Date();

    if (!order.history) {
      order.history = [];
    }
    order.history.push({
      status: order.status,
      timestamp: new Date(),
      note: technicianNotes || `Status updated to ${order.status} by field partner`,
    });

    await order.save();

    await AuditLog.create({
      actorId: req.user?._id,
      role: req.user?.role || 'partner',
      action: 'PARTNER_TASK_UPDATE',
      entityType: 'Order',
      entityId: order._id.toString(),
      metadata: {
        status: order.status,
        opticalSignalDbm,
        technicianNotes,
      },
    });

    logger.info(
      { orderId: order._id, status: order.status, partnerId: req.user?._id },
      'Partner task updated successfully'
    );

    res.json({
      ok: true,
      data: {
        task: {
          taskId: `TSK-${order._id.toString().slice(-8).toUpperCase()}`,
          orderId: order._id,
          status: order.status,
          telemetry: order.telemetry,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
