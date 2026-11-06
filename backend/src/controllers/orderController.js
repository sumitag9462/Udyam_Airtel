import { z } from 'zod';
import {
  createOrder,
  getOrder,
  scheduleInstallationSlot,
  advanceOrderSimulation,
  createHelpRequest,
} from '../services/orderService.js';
import { Order } from '../models/index.js';

const createOrderSchema = z.object({
  quoteId: z.string().min(1),
  leadId: z.string().optional(),
  paymentMethod: z.string().optional(),
  signatoryName: z.string().optional(),
  signedAt: z.string().optional(),
});

const slotSchema = z.object({
  slotDate: z.string().min(1),
  timeWindow: z.string().default('09:00 - 12:00'),
});

const advanceSchema = z.object({
  targetStatus: z.string().optional(),
});

const helpSchema = z.object({
  reason: z.string().optional(),
  note: z.string().optional(),
});

export async function handleCreateOrder(req, res, next) {
  try {
    const idempotencyKey =
      req.headers['idempotency-key'] ||
      req.headers['x-idempotency-key'] ||
      req.body.idempotencyKey;

    const data = createOrderSchema.parse(req.body);
    const userId = req.user._id;

    const order = await createOrder({
      quoteId: data.quoteId,
      leadId: data.leadId,
      userId,
      idempotencyKey,
      paymentMethod: data.paymentMethod,
      signatoryName: data.signatoryName,
      signedAt: data.signedAt,
    });

    res.status(201).json({
      ok: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await getOrder(id, req.user);
    res.json({
      ok: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListOrders(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'owner') {
      filter.userId = req.user._id;
    }
    const orders = await Order.find(filter)
      .populate('quoteId')
      .populate('leadId', 'businessName segment city')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      ok: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleScheduleSlot(req, res, next) {
  try {
    const { id } = req.params;
    const data = slotSchema.parse(req.body);

    const order = await scheduleInstallationSlot(id, data, req.user);
    res.json({
      ok: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSimulateAdvance(req, res, next) {
  try {
    const { id } = req.params;
    const data = advanceSchema.parse(req.body || {});

    const order = await advanceOrderSimulation(id, data.targetStatus, req.user);
    res.json({
      ok: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateHelpRequest(req, res, next) {
  try {
    const { id } = req.params;
    const data = helpSchema.parse(req.body || {});

    const help = await createHelpRequest(id, data, req.user);
    res.status(201).json({
      ok: true,
      data: help,
    });
  } catch (err) {
    next(err);
  }
}
