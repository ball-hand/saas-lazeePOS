import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Search, Send, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmt } from '../utils/format';

export function CustomerMenu() {
  const { tenantId, tableId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, [tenantId, tableId]);

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/public/table/${tenantId}/${tableId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      
      setTenant(json.data.tenant);
      setTable(json.data.table);
      setProducts(json.data.products);
      setCategories(json.data.categories);
      
      if (json.data.categories.length > 0) {
        setActiveCategory(json.data.categories[0]);
      }
      
      // Update theme variables based on tenant
      if (json.data.tenant?.primaryColor) {
        document.documentElement.style.setProperty('--accent-primary', json.data.tenant.primaryColor);
      }
    } catch (err) {
      toast.error('Gagal memuat menu. Silakan scan ulang QR Code.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
    toast.success(`${product.name} ditambahkan`);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any[]);
  };

  const getProductMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  const submitOrder = async () => {
    if (!customerName.trim()) {
      toast.error('Mohon isi nama Anda');
      return;
    }
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      const res = await fetch(`http://localhost:3000/api/v1/public/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tableId,
          customerName,
          items: cart,
          totalAmount
        })
      });

      if (!res.ok) throw new Error('Order failed');
      
      setOrderSuccess(true);
      setCart([]);
    } catch (err) {
      toast.error('Gagal mengirim pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat Menu...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <ChefHat size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Pesanan Diterima!</h1>
        <p className="text-gray-500 mb-8">Pesanan Anda sedang disiapkan oleh dapur. Silakan tunggu di {table?.name}.</p>
        <button 
          onClick={() => setOrderSuccess(false)}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold"
        >
          Pesan Lagi
        </button>
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    (!activeCategory || p.category === activeCategory) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl && <img src={getProductMediaUrl(tenant.logoUrl)} alt="Logo" className="w-10 h-10 object-cover rounded-lg" />}
          <div>
            <h1 className="font-black text-gray-900">{tenant?.name || 'Toko'}</h1>
            <p className="text-xs text-gray-500 font-medium">Anda berada di {table?.name} ({table?.zone?.name})</p>
          </div>
        </div>
      </header>

      {/* Search & Categories */}
      <div className="p-4 bg-white sticky top-[72px] z-10 shadow-sm">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>
        
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              !activeCategory ? 'bg-[var(--accent-primary)] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Semua
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === c ? 'bg-[var(--accent-primary)] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 space-y-4">
        {filteredProducts.map(product => {
          const cartItem = cart.find(i => i.productId === product.id);
          return (
            <div key={product.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-gray-100">
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {product.imageUrl ? (
                  <img src={getProductMediaUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat size={24} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{product.name}</h3>
                  {product.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-black text-[var(--accent-primary)] text-sm">{fmt(product.price)}</span>
                  
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => updateQty(product.id, -1)} className="p-1 rounded-md bg-white shadow-sm text-gray-600">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm min-w-[1ch] text-center">{cartItem.qty}</span>
                      <button onClick={() => updateQty(product.id, 1)} className="p-1 rounded-md bg-[var(--accent-primary)] shadow-sm text-white">
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(product)}
                      className="px-4 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
                    >
                      Tambah
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart / Checkout */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
          <div className="mb-3">
            <input 
              type="text" 
              placeholder="Nama Anda (Cth: Budi)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--accent-primary)] font-bold"
            />
          </div>
          <button 
            onClick={submitOrder}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[var(--accent-primary)] text-white rounded-xl font-black flex items-center justify-between px-5 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>Pesan Sekarang ({cartItemsCount})</span>
            </div>
            <span>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
