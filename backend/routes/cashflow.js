import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cashflow — list transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (type) {
      where.type = type; // 'sale', 'expense', 'income'
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    const transactions = await prisma.cashFlow.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      take: 200,
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Cashflow list error:', error);
    res.status(500).json({ message: 'Failed to fetch cash flow' });
  }
});

// POST /api/cashflow — create manual entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, amount, description } = req.body;

    if (!type || !amount || !description) {
      return res.status(400).json({ message: 'Type, amount, and description are required' });
    }

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({ message: 'Manual entries must be expense or income' });
    }

    const transaction = await prisma.cashFlow.create({
      data: {
        tenantId: req.user.tenantId,
        type,
        amount: parseFloat(amount),
        description,
      },
    });

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Cashflow create error:', error);
    res.status(500).json({ message: 'Failed to record transaction' });
  }
});

// GET /api/cashflow/summary — daily/weekly summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayTransactions = await prisma.cashFlow.findMany({
      where: {
        tenantId: req.user.tenantId,
        transactionDate: { gte: today },
      },
    });

    const monthTransactions = await prisma.cashFlow.findMany({
      where: {
        tenantId: req.user.tenantId,
        transactionDate: { gte: firstDayOfMonth },
      },
    });

    const calcTotal = (transactions) => {
      let income = 0;
      let expense = 0;

      transactions.forEach((t) => {
        const amt = parseFloat(t.amount);
        if (t.type === 'sale' || t.type === 'income') {
          income += amt;
        } else if (t.type === 'expense') {
          expense += amt;
        }
      });

      return { income, expense, net: income - expense };
    };

    res.json({
      today: calcTotal(todayTransactions),
      thisMonth: calcTotal(monthTransactions),
    });
  } catch (error) {
    console.error('Cashflow summary error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

export default router;
