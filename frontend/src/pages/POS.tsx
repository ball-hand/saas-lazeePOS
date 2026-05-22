import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Package } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
// import api from '../api/client'; // Sesuaikan dengan path kodemu

export function POS() {
  const { primaryColor } = useTheme();
  
  // State Management
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false); // Toggle keranjang untuk mobile

  // Di sini kamu bisa masukkan useEffect untuk fetch data produk dari API

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      
      {/* =========================================
          AREA KIRI: KATALOG PRODUK 
      ========================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header & Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Terminal Kasir</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Pilih produk untuk ditambahkan ke keranjang</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama produk..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24 lg:pb-0">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Ganti looping array ini dengan map dari state `products` kamu */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <button 
                key={item}
                onClick={() => addToCart({ id: item, name: `Produk Varian ${item}`, price: 25000 })}
                className="flex flex-col text-left bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent-primary)] transition-all group overflow-hidden shadow-sm"
              >
                <div className="w-full h-32 bg-[var(--bg-main)] rounded-xl mb-3 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-primary-transparent)] transition-colors">
                  <Package size={32} className="opacity-40 group-hover:text-[var(--accent-primary)] group-hover:opacity-100 transition-all group-hover:scale-110" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 text-sm">Produk Varian {item}</h3>
                <p className="text-[var(--accent-primary)] font-bold mt-1">Rp 25.000</p>
              </button>
            ))}

          </div>
        </div>
      </div>

      {/* =========================================
          AREA KANAN: KERANJANG (CART)
      ========================================= */}
      {/* Overlay Background for Mobile Cart */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-[var(--bg-surface-elevated)] border-l border-[var(--border)] shadow-2xl flex flex-col transition-transform duration-300 
        lg:relative lg:translate-x-0 lg:w-[380px] lg:shadow-none lg:rounded-2xl lg:border lg:h-[calc(100vh-2rem)] lg:my-auto
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header Keranjang */}
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center lg:rounded-t-2xl">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShoppingCart size={20} className="text-[var(--accent-primary)]" />
            Keranjang
          </h2>
          <button 
            className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] rounded-lg border border-[var(--border)]"
            onClick={() => setIsCartOpen(false)}
          >
            Tutup
          </button>
        </div>

        {/* List Item Keranjang */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-3">
              <div className="p-4 rounded-full bg-[var(--bg-main)]">
                <ShoppingCart size={40} className="opacity-20" />
              </div>
              <p className="text-sm">Belum ada produk dipilih</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{item.name}</p>
                  <p className="text-sm font-medium text-[var(--accent-primary)]">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] rounded-lg p-1 border border-[var(--border)]">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1.5 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-secondary)] transition-colors">
                    {item.qty === 1 ? <Trash2 size={14} className="text-[var(--danger)]" /> : <Minus size={14} />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-[var(--text-primary)]">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1.5 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-secondary)] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Checkout Button */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-surface-elevated)] lg:rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[var(--text-secondary)] font-medium">Total Tagihan</span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">Rp {total.toLocaleString()}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <CreditCard size={20} />
            Proses Pembayaran
          </button>
        </div>
      </div>

      {/* =========================================
          FLOATING BUTTON (KHUSUS MOBILE)
      ========================================= */}
      <button 
        className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] text-white flex items-center justify-center z-30"
        style={{ background: 'var(--accent-gradient)' }}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[var(--bg-main)]">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </div>
      </button>

    </div>
  );
}