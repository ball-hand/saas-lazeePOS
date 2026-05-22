import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Generate receipt number
function generateReceiptNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const short = uuidv4().slice(0, 6).toUpperCase();
  return `RCP-${date}-${short}`;
}

// POST /api/receipts — create sale (checkout)
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, customerName, paymentMethod, paidAmount, taxRate, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (paidAmount === undefined) {
      return res.status(400).json({ message: 'Paid amount is required' });
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    const receiptItems = [];

    for (const item of items) {
      const lineTotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountApplied || 0;
      subtotal += lineTotal;
      totalDiscount += lineDiscount;

      receiptItems.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || null,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        discountApplied: parseFloat(lineDiscount),
        totalPrice: parseFloat((lineTotal - lineDiscount).toFixed(2)),
      });
    }

    const tax = taxRate ? (subtotal - totalDiscount) * (parseFloat(taxRate) / 100) : 0;
    const total = subtotal - totalDiscount + tax;
    const change = parseFloat(paidAmount) - total;

    if (change < 0) {
      return res.status(400).json({ message: 'Insufficient payment' });
    }

    const receiptNumber = generateReceiptNumber();

    // Create receipt with items in a transaction
    const receipt = await prisma.$transaction(async (tx) => {
      // Create receipt
      const r = await tx.receipt.create({
        data: {
          tenantId: req.user.tenantId,
          customerName: customerName || null,
          subtotalAmount: parseFloat(subtotal.toFixed(2)),
          discountAmount: parseFloat(totalDiscount.toFixed(2)),
          taxAmount: parseFloat(tax.toFixed(2)),
          totalAmount: parseFloat(total.toFixed(2)),
          paidAmount: parseFloat(paidAmount),
          changeGiven: parseFloat(change.toFixed(2)),
          paymentMethod: paymentMethod || 'cash',
          receiptNumber,
          notes: notes || null,
          items: {
            create: receiptItems,
          },
        },
        include: { items: true },
      });

      // Deduct stock for each item
      for (const item of items) {
        if (item.productId) {
          await tx.warehouse.update({
            where: { productId: item.productId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      }

      // Record sale in cash flow
      await tx.cashFlow.create({
        data: {
          tenantId: req.user.tenantId,
          type: 'sale',
          amount: parseFloat(total.toFixed(2)),
          description: `Sale ${receiptNumber}${customerName ? ' - ' + customerName : ''}`,
          referenceId: receiptNumber,
        },
      });

      return r;
    });

    res.status(201).json({ receipt });
  } catch (error) {
    console.error('Receipt create error:', error);
    res.status(500).json({ message: 'Failed to process sale' });
  }
});

// GET /api/receipts — list receipts
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ receipts });
  } catch (error) {
    console.error('Receipts list error:', error);
    res.status(500).json({ message: 'Failed to fetch receipts' });
  }
});

// GET /api/receipts/:id — get single receipt
router.get('/:id', authenticate, async (req, res) => {
  try {
    const receipt = await prisma.receipt.findFirst({
      where: { id: parseInt(req.params.id), tenantId: req.user.tenantId },
      include: { items: true },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.json({ receipt });
  } catch (error) {
    console.error('Receipt fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch receipt' });
  }
});

export default router;
