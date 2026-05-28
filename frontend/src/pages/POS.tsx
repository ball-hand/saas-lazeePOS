import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart, Plus, Minus, CreditCard,
  Package, Loader2, Tag, X, Settings, HelpCircle, Play, Pin
} from 'lucide-react';
import api, { getMediaUrl } from '../api/client';
import { Modal } from '../components/Modal';
import { ReceiptModal } from '../components/ReceiptModal';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const fmt = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  warehouse?: { quantity: number };
  isPinned?: boolean;
}

interface CartItem extends Product {
  qty: number;
  discountApplied: number;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

interface HeldCart {
  id: string;
  customerName: string;
  items: CartItem[];
  heldAt: string;
}

interface PeripheralConfig {
  printerType: 'browser' | 'network';
  printerIp: string;
  scannerType: 'keyboard' | 'direct';
  scannerSuffix: string;
}

// Synthetic sound effect generator for hardware scanner beep
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High-pitch beep
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Moderate volume

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08); // 80ms duration
  } catch (error) {
    console.warn('AudioContext beep blocked/unsupported:', error);
  }
};

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountMap, setDiscountMap] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  /* ── Discounts State ── */
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  /* ── Hold / Recall Queue State ── */
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const stored = localStorage.getItem('pos_held_carts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  /* ── Table Order Integration ── */
  const [activeTableOrderId, setActiveTableOrderId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [activeTableName, setActiveTableName] = useState<string | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('tableOrderId');
    if (orderId && products.length > 0) {
      const loadTableOrder = async () => {
        try {
          const { data } = await api.get(`/tables/orders/detail/${orderId}`);
          const order = data.order;
          
          setActiveTableOrderId(order.id);
          setActiveTableId(order.tableId);
          setActiveTableName(order.tableName);
          setCustomerName(order.customerName);
          
          // Map items
          const mappedItems = order.items.map((i: any) => {
            const product = products.find(p => p.id === i.productId);
            if (!product) return null;
            return {
              ...product,
              qty: i.qty,
              discountApplied: 0
            };
          }).filter(Boolean);
          
          setCart(mappedItems);
          
          // Remove from URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('tableOrderId');
          setSearchParams(newParams);
          
          toast.success(`Pesanan dari Meja ${order.tableName} dimuat!`);
        } catch (err) {
          toast.error('Gagal memuat pesanan meja');
        }
      };
      loadTableOrder();
    }
  }, [searchParams, products, setSearchParams]);

  /* ── Peripheral Setup State ── */
  const [peripheralConfig, setPeripheralConfig] = useState<PeripheralConfig>(() => {
    try {
      const stored = localStorage.getItem('pos_peripheral_config');
      return stored ? JSON.parse(stored) : {
        printerType: 'browser',
        printerIp: '192.168.1.100',
        scannerType: 'keyboard',
        scannerSuffix: 'Enter'
      };
    } catch {
      return {
        printerType: 'browser',
        printerIp: '192.168.1.100',
        scannerType: 'keyboard',
        scannerSuffix: 'Enter'
      };
    }
  });
  const [showPeripheralModal, setShowPeripheralModal] = useState(false);
  
  // Playground state for testing scanner speed
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundLogs, setPlaygroundLogs] = useState<string[]>([]);
  const lastPlaygroundKeyTime = useRef<number>(0);
  const playgroundKeystrokes = useRef<number[]>([]);

  useEffect(() => {
    localStorage.setItem('pos_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  useEffect(() => {
    localStorage.setItem('pos_peripheral_config', JSON.stringify(peripheralConfig));
  }, [peripheralConfig]);

  /* ── Fetch products ── */
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

  useEffect(() => {
    fetchProducts();
    fetchActiveDiscounts();
  }, []);

  const fetchActiveDiscounts = async () => {
    try {
      const { data } = await api.get('/discounts');
      setActiveDiscounts((data.discounts || []).filter((d: any) => d.isActive));
    } catch {}
  };

  /* ── Apply discounts whenever cart changes ── */
  const applyDiscounts = useCallback(async (cartItems: CartItem[], manualDiscountId: string | null) => {
    if (!cartItems.length) { setDiscountMap({}); return; }
    try {
      const items = cartItems.map(i => ({
        productId: i.id,
        quantity: i.qty,
        unitPrice: i.price,
        category: i.category,
      }));
      
      const payload: any = { items };
      if (manualDiscountId) payload.manualDiscountId = manualDiscountId;

      const { data } = await api.post('/discounts/apply', payload);
      const map: Record<string, number> = {};
      for (const d of (data.discounts || [])) map[d.productId] = d.discount;
      setDiscountMap(map);
    } catch {
      // discount errors are non-fatal
    }
  }, []);

  useEffect(() => { applyDiscounts(cart, selectedDiscountId); }, [cart, selectedDiscountId, applyDiscounts]);

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

  const updateQty = (id: string, delta: number) => {
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

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setDiscountMap({}); };

  /* ── Queue / Hold Helpers ── */
  const holdCurrentCart = () => {
    if (!cart.length) {
      toast.error('Keranjang kosong, tidak ada transaksi untuk ditangguhkan!');
      return;
    }
    const newHeld: HeldCart = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      customerName: customerName.trim() || `Pelanggan #${heldCarts.length + 1}`,
      items: [...cart],
      heldAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setHeldCarts(prev => [newHeld, ...prev]);
    clearCart();
    setCustomerName('');
    toast.success('Transaksi berhasil ditangguhkan ke antrean! 📥');
  };

  const recallCart = (held: HeldCart) => {
    if (cart.length > 0) {
      // Overwrite or warning? In high-speed retail we hold/swap.
      // Let's hold the current cart automatically or swap it.
      // We will hold the current active cart to prevent losing work, and recall the selected one!
      const activeHeld: HeldCart = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        customerName: customerName.trim() || `Pelanggan #${heldCarts.length + 1}`,
        items: [...cart],
        heldAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setHeldCarts(prev => [activeHeld, ...prev.filter(c => c.id !== held.id)]);
      toast.success('Transaksi aktif saat ini ditangguhkan ke antrean.');
    } else {
      setHeldCarts(prev => prev.filter(c => c.id !== held.id));
    }
    setCart(held.items);
    setCustomerName(held.customerName.startsWith('Pelanggan #') ? '' : held.customerName);
    toast.success(`Transaksi "${held.customerName}" dipulihkan! 📤`);
    setIsQueueOpen(false);
  };

  const deleteHeldCart = (id: string) => {
    setHeldCarts(prev => prev.filter(c => c.id !== id));
    toast.success('Transaksi ditangguhkan berhasil dihapus.');
  };

  /* ── Handle Barcode Scan Logic ── */
  const handleBarcodeScan = useCallback((sku: string) => {
    const found = products.find(p => p.sku && p.sku.toLowerCase() === sku.trim().toLowerCase());
    if (found) {
      const stock = found.warehouse?.quantity ?? 999;
      const inCart = cart.find(i => i.id === found.id)?.qty || 0;
      if (inCart >= stock) {
        toast.error(`Stok "${found.name}" tidak mencukupi!`);
        return;
      }
      addToCart(found);
      playBeep();
      toast.success(`Ter-scan: ${found.name}`);
    } else {
      toast.error(`SKU/Barcode "${sku}" tidak ditemukan.`);
    }
  }, [products, cart]);

  // Global scanner keyboard listener (rapid input sequence)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing in standard inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      const currentTime = Date.now();
      // If delay between keys is > 50ms, it is human entry, reset buffer
      if (currentTime - lastKeyTime > 50) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          e.preventDefault();
          handleBarcodeScan(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScan]);

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleBarcodeScan(barcodeInput);
    setBarcodeInput('');
  };

  /* ── Playground Scanner Test ── */
  const handlePlaygroundKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

    const currentTime = Date.now();
    if (lastPlaygroundKeyTime.current !== 0) {
      const diff = currentTime - lastPlaygroundKeyTime.current;
      playgroundKeystrokes.current.push(diff);
    }
    lastPlaygroundKeyTime.current = currentTime;

    if (e.key === 'Enter') {
      const totalLen = playgroundInput.length;
      const avgInterval = playgroundKeystrokes.current.length > 0 
        ? Math.round(playgroundKeystrokes.current.reduce((a, b) => a + b, 0) / playgroundKeystrokes.current.length) 
        : 0;
      
      const isScanner = avgInterval < 35 && totalLen > 3;

      setPlaygroundLogs(prev => [
        `Scan selesai: "${playgroundInput}" | Panjang: ${totalLen} | Jeda rata-rata: ${avgInterval}ms | Sumber: ${isScanner ? '📠 SCANNER FISIK' : '⌨️ INPUT MANUAL'}`,
        ...prev
      ]);

      if (isScanner || totalLen > 2) {
        playBeep();
      }

      setPlaygroundInput('');
      playgroundKeystrokes.current = [];
      lastPlaygroundKeyTime.current = 0;
    }
  };

  // Test Print function
  const handleTestPrint = () => {
    toast.success('Mengirim halaman tes cetak ke printer...');
    // Create iframe or simple print window for test
    const printWindow = window.open('', '_blank', 'width=300,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3>TEST PRINT SUCCESS</h3>
            <p>LAZEEPOS SAAS PLATFORM</p>
          </div>
          <div class="line"></div>
          <p>Printer IP: ${peripheralConfig.printerType === 'network' ? peripheralConfig.printerIp : 'LOCAL SYSTEM'}</p>
          <p>Status: ONLINE / READY</p>
          <p>Tanggal: ${new Date().toLocaleString('id-ID')}</p>
          <div class="line"></div>
          <div class="center">
            <p>Terima Kasih</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  /* ── Totals ── */
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalDiscount = cart.reduce((s, i) => s + (discountMap[i.id] || 0), 0);
  
  // Read taxRate from settings config
  const storedConfig = localStorage.getItem('pos_receipt_config');
  let taxRate = 0;
  if (storedConfig) {
    try {
      const parsed = JSON.parse(storedConfig);
      taxRate = parsed.taxRate || 0;
    } catch (e) {
      console.error(e);
    }
  }
  const taxAmount = (subtotal - totalDiscount) * (taxRate / 100);
  const total = subtotal - totalDiscount + taxAmount;
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
      // Get stored custom receipt/tax settings
      const storedConfig = localStorage.getItem('pos_receipt_config');
      let currentTaxRate = 0;
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          currentTaxRate = parsed.taxRate || 0;
        } catch (e) {
          console.error(e);
        }
      }

      const { data } = await api.post('/receipts', {
        items,
        customerName: customerName || null,
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? paid : total,
        taxRate: currentTaxRate,
        notes: null,
        tableOrderId: activeTableOrderId,
        tableId: activeTableId
      });
      toast.success('Transaksi berhasil! 🎉');
      setReceipt(data.receipt);
      setShowReceipt(true);
      setShowPaymentModal(false);
      clearCart();
      setCustomerName('');
      setPaidAmount('');
      setActiveTableOrderId(null);
      setActiveTableId(null);
      setActiveTableName(null);
      fetchProducts(); // Refresh products stock level in POS Catalog
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Checkout gagal.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 relative">

      {/* ── LEFT: Product Catalog ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        <div className="mb-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
              {/* Printer Status Badge */}
              <button
                onClick={() => setShowPeripheralModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-transparent)] border border-[var(--success)]/20 text-[var(--success)] text-[10px] font-bold hover:bg-[var(--success-transparent)]/80 transition-all shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Printer: {peripheralConfig.printerType === 'browser' ? 'READY' : 'ONLINE'}
              </button>

              {/* Scanner Status Badge */}
              <button
                onClick={() => setShowPeripheralModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-transparent)] border border-[var(--success)]/20 text-[var(--success)] text-[10px] font-bold hover:bg-[var(--success-transparent)]/80 transition-all shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Scanner: ACTIVE
              </button>

              {/* Held Carts / Queue Button */}
              <button
                onClick={() => setIsQueueOpen(true)}
                className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] text-[10px] font-bold transition-all shadow-sm"
              >
                <ShoppingCart size={11} className="text-[var(--accent-primary)]" />
                Antrean
                {heldCarts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-[var(--accent-primary)] text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full">
                    {heldCarts.length}
                  </span>
                )}
              </button>

              {/* Setup Gear Icon */}
              <button
                onClick={() => setShowPeripheralModal(true)}
                className="p-1 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all shadow-sm"
                title="Setup Periferal"
              >
                <Settings size={14} />
              </button>
            </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Manual Barcode Input */}
            <form onSubmit={handleManualBarcodeSubmit} className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Scan / Input SKU..."
                className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm shadow-sm font-bold"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--accent-primary)] hover:text-white transition-colors"
              >
                Enter
              </button>
            </form>
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
                    <div className="w-full h-24 bg-[var(--bg-main)] rounded-xl mb-3 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-primary-transparent)] transition-colors relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={getMediaUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <Package size={28} className="opacity-30 group-hover:opacity-80 group-hover:text-[var(--accent-primary)] transition-all" />
                      )}
                      {product.isPinned && (
                        <div className="absolute top-2 right-2 bg-amber-500/10 text-amber-500 p-1 rounded-md shadow-sm border border-amber-500/20" title="Produk Pilihan (Di-pin)">
                          <Pin size={12} fill="currentColor" />
                        </div>
                      )}
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl">
                          HABIS
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-[var(--text-primary)] line-clamp-2 leading-tight">{product.name}</p>
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* ── RIGHT: Cart ── */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-[var(--bg-surface-elevated)] border border-[var(--border)] shadow-2xl flex flex-col transition-transform duration-300
        lg:relative lg:translate-x-0 lg:w-[380px] lg:shadow-sm lg:rounded-3xl lg:h-full overflow-hidden
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cart Header */}
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShoppingCart size={20} className="text-[var(--accent-primary)]" />
              Keranjang
              {cart.length > 0 && (
                <span className="ml-1 bg-[var(--accent-primary)] text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </h2>
            {activeTableName && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                Meja: {activeTableName}
              </div>
            )}
          </div>
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
          <div className="flex justify-between items-center mb-3">
            <button 
              onClick={() => setShowDiscountModal(true)}
              className={`text-xs font-bold flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg -ml-2 ${selectedDiscountId ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)]'}`}
            >
              <Tag size={14} /> 
              {selectedDiscountId ? 'Diskon/Kupon Diterapkan' : 'Gunakan Kupon Promo'}
            </button>
            {selectedDiscountId && (
              <button 
                onClick={() => setSelectedDiscountId(null)} 
                className="text-[10px] text-[var(--danger)] font-bold hover:underline"
              >
                Batalkan Kupon
              </button>
            )}
          </div>
          
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
          {taxRate > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-secondary)]">Pajak PPN ({taxRate}%)</span>
              <span className="text-[var(--text-secondary)]">{fmt(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="text-[var(--text-secondary)] font-semibold text-sm">Total Tagihan</span>
            <span className="text-xl font-black text-[var(--text-primary)]">{fmt(total)}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              disabled={cart.length === 0}
              onClick={holdCurrentCart}
              className="px-3.5 py-3.5 rounded-xl font-bold bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5 shadow-sm"
              title="Tangguhkan transaksi saat ini ke antrean"
            >
              Hold
            </button>
            <button
              disabled={cart.length === 0}
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <CreditCard size={18} /> Proses Pembayaran
            </button>
          </div>
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

      {/* ── Held Transactions (Antrean) Drawer/Modal ── */}
      {isQueueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsQueueOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 animate-fade-in flex flex-col max-h-[85vh]">
            <button
              onClick={() => setIsQueueOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-1 flex items-center gap-2">
              📥 Antrean Transaksi
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Pulihkan transaksi yang ditangguhkan sebelumnya</p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {heldCarts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)] gap-2">
                  <ShoppingCart size={32} className="opacity-15" />
                  <p className="text-xs font-semibold">Tidak ada transaksi dalam antrean</p>
                </div>
              ) : (
                heldCarts.map(hc => {
                  const itemsCount = hc.items.reduce((s, i) => s + i.qty, 0);
                  const itemsTotal = hc.items.reduce((s, i) => s + (i.price * i.qty), 0);
                  return (
                    <div key={hc.id} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{hc.customerName}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{itemsCount} item &bull; {fmt(itemsTotal)}</p>
                        <p className="text-[9px] text-[var(--text-secondary)]/70 mt-1">Ditangguhkan jam {hc.heldAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => recallCart(hc)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow hover:shadow-md"
                          style={{ background: 'var(--accent-gradient)' }}
                        >
                          Pulihkan
                        </button>
                        <button
                          onClick={() => deleteHeldCart(hc.id)}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors border border-transparent hover:border-[var(--danger)]/20"
                          title="Hapus dari antrean"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Peripheral Setup Modal ── */}
      {showPeripheralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPeripheralModal(false)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setShowPeripheralModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-1 flex items-center gap-2">
              ⚙️ Pengaturan Periferal POS
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-5">Setup printer thermal struk dan pemindai barcode fisik</p>

            <div className="space-y-5">
              {/* Printer Section */}
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    🖨️ Printer Thermal Struk
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] bg-[var(--success-transparent)] text-[var(--success)] px-2 py-0.5 rounded-full font-black border border-[var(--success)]/20">
                    ONLINE
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Metode Koneksi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['browser', 'network'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setPeripheralConfig(prev => ({ ...prev, printerType: t }))}
                          className={`py-2 rounded-xl text-xs font-black border transition-all ${
                            peripheralConfig.printerType === t
                              ? 'text-white border-transparent'
                              : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                          }`}
                          style={peripheralConfig.printerType === t ? { background: 'var(--accent-gradient)' } : {}}
                        >
                          {t === 'browser' ? 'Browser Print (System)' : 'IP Network Printer'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {peripheralConfig.printerType === 'network' && (
                    <div className="animate-fade-in">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                        IP Address Printer (Ethernet/WiFi)
                      </label>
                      <input
                        type="text"
                        placeholder="Cth: 192.168.1.100"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-all text-xs font-bold"
                        value={peripheralConfig.printerIp}
                        onChange={e => setPeripheralConfig(prev => ({ ...prev, printerIp: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleTestPrint}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold text-white hover:shadow-md transition-all flex items-center gap-1.5"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      <Play size={11} /> Cetak Halaman Tes
                    </button>
                  </div>
                </div>
              </div>

              {/* Barcode Scanner Section */}
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    🔍 Barcode Scanner
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] bg-[var(--success-transparent)] text-[var(--success)] px-2 py-0.5 rounded-full font-black border border-[var(--success)]/20">
                    LISTENING
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Mode Input Pemindai
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Emulasi Keyboard USB (Auto-Detect)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] outline-none text-xs font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* Playground test box */}
                  <div className="p-3 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-1">
                      <HelpCircle size={12} className="text-[var(--accent-primary)]" />
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Playground Scanner (Arahkan pemindai & scan kesini)
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Posisikan kursor & scan barcode disini untuk tes..."
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-xs"
                      value={playgroundInput}
                      onChange={e => setPlaygroundInput(e.target.value)}
                      onKeyDown={handlePlaygroundKeyDown}
                    />

                    {playgroundLogs.length > 0 && (
                      <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pt-1">
                        {playgroundLogs.map((log, i) => (
                          <div key={i} className="flex gap-1.5 items-start text-[10px] leading-tight text-[var(--text-secondary)] font-mono">
                            <span className="text-[var(--accent-primary)]">&bull;</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPeripheralModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all text-xs"
              >
                Tutup & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 animate-fade-in">
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
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">Pajak PPN ({taxRate}%)</span>
                    <span className="text-[var(--text-primary)]">{fmt(taxAmount)}</span>
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
      {showReceipt && receipt && (
        <ReceiptModal isOpen={showReceipt} receipt={receipt} onClose={() => setShowReceipt(false)} />
      )}

      {/* ── Disount/Coupon Modal ── */}
      <Modal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} title="Pilih Kupon / Promo Aktif">
        <div className="flex flex-col gap-3">
          {activeDiscounts.length === 0 ? (
            <div className="text-center p-5 text-[var(--text-secondary)] flex flex-col items-center gap-2">
              <Tag size={32} className="opacity-20" />
              <p className="text-sm font-medium">Tidak ada promo yang sedang aktif saat ini.</p>
            </div>
          ) : (
            activeDiscounts.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDiscountId(d.id); setShowDiscountModal(false); }}
                className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
                  selectedDiscountId === d.id 
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] shadow-[0_0_0_1px_var(--accent-primary)]' 
                    : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)]'
                }`}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-[var(--text-primary)] text-sm">{d.name}</span>
                  {selectedDiscountId === d.id && <span className="text-xs font-black text-[var(--accent-primary)]">DIPILIH</span>}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  Diskon: <span className="font-bold text-[var(--success)]">{d.discountType === 'percentage' ? `${d.discountValue}%` : d.discountType === 'fixed_amount' ? fmt(d.discountValue) : 'Beli N Gratis 1'}</span>
                </span>
                {d.minOrderAmount > 0 && <span className="text-[10px] text-[var(--text-secondary)] mt-1">Min. Belanja: {fmt(d.minOrderAmount)}</span>}
              </button>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
}
