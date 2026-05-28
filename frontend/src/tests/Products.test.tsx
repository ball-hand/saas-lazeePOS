import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Products } from '../pages/Products';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: vi.fn(() => Promise.resolve({
      data: {
        products: [{ id: '1', name: 'Sabun Mandi', price: 5000, category: 'Kebutuhan', warehouse: { quantity: 10 } }],
        categories: ['Kebutuhan']
      }
    })),
  },
  getMediaUrl: vi.fn(() => 'mock-url')
}));

describe('Products Management UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Harus merender tabel produk dengan benar', async () => {
    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Nama Produk')).toBeInTheDocument();
    });
  });
});
