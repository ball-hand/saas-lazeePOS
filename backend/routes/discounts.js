import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/discounts — list discount rules
router.get('/', authenticate, async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ discounts });
  } catch (error) {
    console.error('Discounts list error:', error);
    res.status(500).json({ message: 'Failed to fetch discounts' });
  }
});

// POST /api/discounts — create discount rule
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      name, discountType, discountValue, appliesTo, appliesToId,
      appliesToCategory, minQuantity, minOrderAmount, startsAt, endsAt, isActive,
    } = req.body;

    if (!name || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'Name, type, and value are required' });
    }

    const discount = await prisma.discount.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        discountType,
        discountValue: parseFloat(discountValue),
        appliesTo: appliesTo || 'all',
        appliesToId: appliesToId || null,
        appliesToCategory: appliesToCategory || null,
        minQuantity: parseInt(minQuantity) || 1,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ discount });
  } catch (error) {
    console.error('Discount create error:', error);
    res.status(500).json({ message: 'Failed to create discount' });
  }
});

// PUT /api/discounts/:id — update discount rule
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, discountType, discountValue, appliesTo, appliesToId,
      appliesToCategory, minQuantity, minOrderAmount, startsAt, endsAt, isActive,
    } = req.body;

    const existing = await prisma.discount.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Discount not found' });

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(appliesTo !== undefined && { appliesTo }),
        ...(appliesToId !== undefined && { appliesToId: appliesToId || null }),
        ...(appliesToCategory !== undefined && { appliesToCategory }),
        ...(minQuantity !== undefined && { minQuantity: parseInt(minQuantity) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ discount });
  } catch (error) {
    console.error('Discount update error:', error);
    res.status(500).json({ message: 'Failed to update discount' });
  }
});

// DELETE /api/discounts/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.discount.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Discount not found' });

    await prisma.discount.delete({
      where: { id },
    });
    res.json({ message: 'Discount rule deleted' });
  } catch (error) {
    console.error('Discount delete error:', error);
    res.status(500).json({ message: 'Failed to delete discount' });
  }
});

// POST /api/discounts/apply — calculate discounts for a cart
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { items, manualDiscountId } = req.body; // [{ productId, quantity, unitPrice }]

    if (!items || !items.length) {
      return res.json({ discounts: [], totalDiscount: 0 });
    }

    const now = new Date();
    
    if (!manualDiscountId) {
      return res.json({ discounts: [], totalDiscount: 0 });
    }

    // Only fetch the specifically requested manual discount
    const rules = await prisma.discount.findMany({
      where: {
        tenantId: req.user.tenantId,
        isActive: true,
        id: manualDiscountId,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
    });

    // Filter rules that haven't ended
    const activeRules = rules.filter(
      (r) => !r.endsAt || new Date(r.endsAt) >= now
    );

    const orderTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const appliedDiscounts = [];
    let totalDiscount = 0;

    for (const item of items) {
      let bestDiscount = 0;
      let bestRuleName = '';

      for (const rule of activeRules) {
        // Check min order amount
        if (rule.minOrderAmount && orderTotal < parseFloat(rule.minOrderAmount)) continue;

        // Check scope
        if (rule.appliesTo === 'product' && rule.appliesToId !== item.productId) continue;
        if (rule.appliesTo === 'category' && rule.appliesToCategory !== item.category) continue;

        // Check min quantity
        if (item.quantity < rule.minQuantity) continue;

        let discount = 0;
        if (rule.discountType === 'percentage') {
          discount = (item.unitPrice * item.quantity * parseFloat(rule.discountValue)) / 100;
        } else if (rule.discountType === 'fixed_amount') {
          discount = parseFloat(rule.discountValue) * item.quantity;
        } else if (rule.discountType === 'bogo') {
          // Buy N get 1 free
          const freeItems = Math.floor(item.quantity / (rule.minQuantity + 1));
          discount = freeItems * item.unitPrice;
        }

        // Best discount wins
        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestRuleName = rule.name;
        }
      }

      if (bestDiscount > 0) {
        appliedDiscounts.push({
          productId: item.productId,
          discount: Math.round(bestDiscount * 100) / 100,
          ruleName: bestRuleName,
        });
        totalDiscount += bestDiscount;
      }
    }

    res.json({
      discounts: appliedDiscounts,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
    });
  } catch (error) {
    console.error('Discount apply error:', error);
    res.status(500).json({ message: 'Failed to calculate discounts' });
  }
});

export default router;
