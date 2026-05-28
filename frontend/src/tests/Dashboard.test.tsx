import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: vi.fn(() => Promise.resolve({
      data: {
        todaySalesAmount: 150000,
        monthSalesAmount: 4500000,
        lowStockCount: 2,
        popularProducts: [],
        recentTransactions: []
      }
    })),
  },
  getMediaUrl: vi.fn(() => 'mock-url')
}));

// Mock Recharts to avoid DOM errors in JSDOM
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div>LineChart Mock</div>,
    Line: () => <div>Line Mock</div>,
  };
});

describe('Dashboard UI Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Harus merender metric card dengan nominal penjualan', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rp 150.000')).toBeInTheDocument();
      expect(screen.getByText('Rp 4.500.000')).toBeInTheDocument();
    });
  });
});
