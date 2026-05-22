import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, Plus, Minus, CreditCard,
  Package, Loader2, Tag, X,
} from 'lucide-react';
import api from '../api/client';
import { ReceiptModal } from '../components/ReceiptModal';
import toast from 'react-hot-toast';

const fmt = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

interface Product {
  id: number;
  name: string;
  sku?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  warehouse?: { quantity: number };
}

interface CartItem extends Product {
  qty: number;
  discountApplied: number;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountMap, setDiscountMap] = useState<Record<number, number>>({});
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  /* ── Fetch products ── */
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/products', { params: { active: 'true' } });
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } catch {
        toast.error('Gagal memuat produk.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ── Apply discounts whenever cart changes ── */
  const applyDiscounts = useCallback(async (cartItems: CartItem[]) => {
    if (!cartItems.length) { setDiscountMap({}); return; }
    try {
      const items = cartItems.map(i => ({
        productId: i.id,
        quantity: i.qty,
        unitPrice: i.price,
        category: i.category,
      }));
      const { data } = await api.post('/discounts/apply', { items });
      const map: Record<number, number> = {};
      for (const d of (data.discounts || [])) map[d.productId] = d.discount;
      setDiscountMap(map);
    } catch {
      // discount errors are non-fatal
    }
  }, []);

  useEffect(() => { applyDiscounts(cart); }, [cart, applyDiscounts]);

  /* ── Cart helpers ── */
  const addToCart = (product: Product) => {
    const stock = product.warehouse?.quantity ?? 999;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= stock) { toast.error('Stok tidak mencukupi!'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, discountApplied: 0 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const stock = item.warehouse?.quantity ?? 999;
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      if (newQty > stock) { toast.error('Stok tidak mencukupi!'); return prev; }
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setDiscountMap({}); };

  /* ── Totals ── */
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalDiscount = cart.reduce((s, i) => s + (discountMap[i.id] || 0), 0);
  const total = subtotal - totalDiscount;
  const change = parseFloat(paidAmount || '0') - total;

  /* ── Filtered products ── */
  const filtered = products.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (!cart.length) return;
    const paid = parseFloat(paidAmount);
    if (paymentMethod === 'cash' && (isNaN(paid) || paid < total)) {
      toast.error('Jumlah pembayaran kurang!'); return;
    }
    setIsCheckingOut(true);
    try {
      const items = cart.map(i => ({
        productId: i.id,
        productName: i.name,
        sku: i.sku || null,
        quantity: i.qty,
        unitPrice: i.price,
        discountApplied: discountMap[i.id] || 0,
      }));
      const { data } = await api.post('/receipts', {
        items,
        customerName: customerName || null,
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? paid : total,
        notes: null,
      });
      toast.success('Transaksi berhasil! 🎉');
      setReceipt(data.receipt);
      setShowReceipt(true);
      setShowPaymentModal(false);
      clearCart();
      setCustomerName('');
      setPaidAmount('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Checkout gagal.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">

      {/* ── LEFT: Product Catalog ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header + Search */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Terminal Kasir</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Pilih produk untuk ditambahkan ke keranjang</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                !activeCategory
                  ? 'text-white border-transparent shadow'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
              }`}
              style={!activeCategory ? { background: 'var(--accent-gradient)' } : {}}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  activeCategory === cat
                    ? 'text-white border-transparent shadow'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                }`}
                style={activeCategory === cat ? { background: 'var(--accent-gradient)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-24 lg:pb-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-44 bg-[var(--bg-surface-elevated)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)] gap-3">
              <Package size={40} className="opacity-20" />
              <p className="text-sm font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => {
                const outOfStock = (product.warehouse?.quantity ?? 0) === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && addToCart(product)}
                    disabled={outOfStock}
                    className={`flex flex-col text-left bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 transition-all group overflow-hidden shadow-sm ${
                      outOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-[var(--accent-primary)] hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    <div className="w-full h-24 bg-[var(--bg-main)] rounded-xl mb-3 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-primary-transparent)] transition-colors relative">
                      <Package size={28} className="opacity-30 group-hover:opacity-80 group-hover:text-[var(--accent-primary)] transition-all" />
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl">
                          HABIS
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-[var(--text-primary)] line-clamp-2 text-sm leading-tight">{product.name}</p>
                    {product.category && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{product.category}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[var(--accent-primary)] font-bold text-sm">{fmt(product.price)}</p>
                      <span className="text-[10px] text-[var(--text-secondary)]">Stok: {product.warehouse?.quantity ?? '?'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* ── RIGHT: Cart ── */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-[var(--bg-surface-elevated)] border-l border-[var(--border)] shadow-2xl flex flex-col transition-transform duration-300
        lg:relative lg:translate-x-0 lg:w-[380px] lg:shadow-none lg:rounded-2xl lg:border lg:h-[calc(100vh-8rem)] lg:sticky lg:top-6
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cart Header */}
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShoppingCart size={20} className="text-[var(--accent-primary)]" />
            Keranjang
            {cart.length > 0 && (
              <span className="ml-1 bg-[var(--accent-primary)] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all border border-transparent hover:border-[var(--danger)]/20 font-bold"
              >
                Kosongkan
              </button>
            )}
            <button
              className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] rounded-lg border border-[var(--border)]"
              onClick={() => setIsCartOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-3">
              <div className="p-4 rounded-full bg-[var(--bg-main)]">
                <ShoppingCart size={36} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Keranjang kosong</p>
            </div>
          ) : (
            cart.map(item => {
              const disc = discountMap[item.id] || 0;
              return (
                <div key={item.id} className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{fmt(item.price)} / pcs</p>
                      {disc > 0 && (
                        <p className="text-xs text-[var(--success)] font-bold mt-0.5 flex items-center gap-1">
                          <Tag size={10} /> Diskon -{fmt(disc)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] rounded-lg p-1 border border-[var(--border)]">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1.5 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-secondary)] transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-black text-[var(--text-primary)]">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1.5 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-secondary)] transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-black text-sm text-[var(--text-primary)]">
                      {fmt((item.price * item.qty) - disc)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals + Checkout */}
        <div className="p-4 border-t border-[var(--border)]">
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-secondary)]">Subtotal</span>
              <span className="text-[var(--text-secondary)] line-through">{fmt(subtotal)}</span>
            </div>
          )}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--success)] font-bold flex items-center gap-1"><Tag size={12} /> Diskon</span>
              <span className="text-[var(--success)] font-bold">-{fmt(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="text-[var(--text-secondary)] font-semibold text-sm">Total Tagihan</span>
            <span className="text-2xl font-black text-[var(--text-primary)]">{fmt(total)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <CreditCard size={18} /> Proses Pembayaran
          </button>
        </div>
      </div>

      {/* ── Mobile FAB ── */}
      <button
        className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white z-30 flex items-center gap-2"
        style={{ background: 'var(--accent-gradient)' }}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingCart size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[var(--bg-main)]">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>
      </button>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 animate-fade-in">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-5">💳 Proses Pembayaran</h2>

            <div className="space-y-4">
              {/* Customer name */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">
                  Nama Pelanggan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Cth: Budi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-all text-sm"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        paymentMethod === m
                          ? 'text-white border-transparent'
                          : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                      }`}
                      style={paymentMethod === m ? { background: 'var(--accent-gradient)' } : {}}
                    >
                      {m === 'cash' ? 'Tunai' : m === 'card' ? 'Kartu' : 'Transfer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)]">Subtotal</span>
                  <span className="text-[var(--text-primary)]">{fmt(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--success)]">Diskon</span>
                    <span className="text-[var(--success)]">-{fmt(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-2 border-t border-[var(--border)] mt-1">
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span className="text-[var(--accent-primary)] text-lg">{fmt(total)}</span>
                </div>
              </div>

              {/* Paid amount (cash only) */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder={String(Math.ceil(total))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-all text-sm font-bold"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                  />
                  {parseFloat(paidAmount) >= total && paidAmount && (
                    <p className="text-[var(--success)] text-sm font-bold mt-1.5">
                      Kembalian: {fmt(change)}
                    </p>
                  )}
                  {parseFloat(paidAmount) < total && paidAmount && (
                    <p className="text-[var(--danger)] text-sm font-bold mt-1.5">
                      Kurang: {fmt(total - parseFloat(paidAmount))}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || (paymentMethod === 'cash' && parseFloat(paidAmount || '0') < total)}
                className="w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {isCheckingOut ? (
                  <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                ) : (
                  <><CreditCard size={18} /> Selesaikan Transaksi</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receipt}
      />
    </div>
  );
}
