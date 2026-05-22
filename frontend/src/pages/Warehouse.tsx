import { useState } from 'react';
import { Package, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function Warehouse() {
  const [stockItems] = useState([
    { id: 1, name: 'Espresso Blend 200g', sku: 'KP-001', warehouseStock: 140, shelfStock: 25, minStock: 20 },
    { id: 2, name: 'Premium Matcha Powder', sku: 'TH-003', warehouseStock: 45, shelfStock: 12, minStock: 15 },
  ]);

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Manajemen Gudang</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Pantau suplai stok besar di gudang utama dan distribusi ke rak kasir.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)] transition-all text-sm flex items-center gap-2 shadow-sm">
            <ArrowDownLeft size={16} className="text-[var(--success)]" /> Restock Gudang
          </button>
          <button className="px-4 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow-sm hover:opacity-90 transition-all" style={{ background: 'var(--accent-gradient)' }}>
            <ArrowUpRight size={16} /> Transfer ke Rak
          </button>
        </div>
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Item Terdaftar</p>
            <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">384 Barang</p>
          </div>
        </div>
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)]">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Perlu Segera Diorder</p>
            <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">5 Item Low</p>
          </div>
        </div>
      </div>

      {/* Tabel Inventori Gudang */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Barang</th>
                <th className="p-4 font-semibold text-center">Stok Gudang Utama</th>
                <th className="p-4 font-semibold text-center">Stok Display/Rak</th>
                <th className="p-4 font-semibold text-center">Batas Minimum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {stockItems.map((item) => {
                const isLow = (item.warehouseStock + item.shelfStock) <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                    <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">{item.sku}</td>
                    <td className="p-4 font-bold text-[var(--text-primary)]">{item.name}</td>
                    <td className="p-4 text-center font-bold text-[var(--text-primary)]">{item.warehouseStock} Bag/Pcs</td>
                    <td className="p-4 text-center font-medium text-[var(--text-secondary)]">{item.shelfStock} Pcs</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isLow 
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' 
                          : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}>
                        {item.minStock} Unit
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}