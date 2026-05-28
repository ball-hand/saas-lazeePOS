import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POS } from '../pages/POS';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock API calls
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/products') {
        return Promise.resolve({
          data: {
            products: [
              { id: '1', name: 'Nasi Goreng', price: 20000, isPinned: true },
              { id: '2', name: 'Es Teh', price: 5000, isPinned: false }
            ]
          }
        });
      }
      if (url === '/discounts') {
        return Promise.resolve({ data: { discounts: [] } });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: { receipt: { id: '123' } } })),
  }
}));

describe('POS Terminal Core Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Harus merender produk dengan benar dan bisa ditambahkan ke keranjang', async () => {
    render(
      <BrowserRouter>
        <POS />
      </BrowserRouter>
    );

    // Pastikan produk ter-render dari API Mock
    await waitFor(() => {
      expect(screen.getByText('Nasi Goreng')).toBeInTheDocument();
      expect(screen.getByText('Es Teh')).toBeInTheDocument();
    });

    // Simulasi Kasir mengklik produk Nasi Goreng
    const nasiGorengCard = screen.getByText('Nasi Goreng').closest('div');
    if (nasiGorengCard) fireEvent.click(nasiGorengCard);

    // Cek apakah masuk ke keranjang
    await waitFor(() => {
      // Di area keranjang, Subtotal harus Rp 20.000
      const items = screen.queryAllByText(/20\.000/);
      expect(items.length).toBeGreaterThan(0);
    });
  });
});
