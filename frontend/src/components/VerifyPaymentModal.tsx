import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ChefHat, CheckCircle2, Receipt, Image as ImageIcon, MapPin, ExternalLink } from 'lucide-react';
import api, { getMediaUrl } from '../api/client';
import toast from 'react-hot-toast';

interface VerifyPaymentModalProps {
  orderId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VerifyPaymentModal({ orderId, onClose, onSuccess }: VerifyPaymentModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (orderId) {
      setShowSuccess(false);
      fetchOrderDetail();
    } else {
      setOrder(null);
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/tables/orders/detail/${orderId}`);
      if (res.data && res.data.order) {
        // Parse items if it's a string
        const fetchedOrder = res.data.order;
        if (typeof fetchedOrder.items === 'string') {
          fetchedOrder.items = JSON.parse(fetchedOrder.items);
        }
        setOrder(fetchedOrder);
      }
    } catch (err) {
      toast.error('Gagal memuat detail pesanan');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!orderId) return;
    setIsVerifying(true);
    try {
      await api.put(`/tables/orders/${orderId}/verify`);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinish = () => {
    setShowSuccess(false);
    onClose();
    if (onSuccess) onSuccess();
  };

  if (!orderId) return null;

  if (showSuccess) {
    return (
      <Modal isOpen={true} onClose={handleFinish} title="Verifikasi Berhasil" size="sm">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ChefHat size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Pembayaran Sah!</h2>
          <p className="text-[var(--text-secondary)] font-bold text-sm mb-8">
            Pesanan telah dilunasi dan otomatis diteruskan ke <strong>Antrean Dapur</strong> untuk diproses.
          </p>
          <button
            onClick={handleFinish}
            className="w-full py-3 bg-[var(--accent-primary)] text-white font-black rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Tutup
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Konfirmasi Pembayaran QRIS" size="md">
      {isLoading || !order ? (
        <div className="p-8 flex justify-center items-center">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="p-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                <MapPin size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Meja {order.tableName}</span>
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)]">
                {order.customerName || 'Pelanggan'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                Menunggu Verifikasi
              </span>
              <p className="text-lg font-black text-[var(--accent-primary)]">
                Rp {order.totalAmount?.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border)] max-h-40 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
              <Receipt size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Ringkasan Pesanan</span>
            </div>
            <ul className="space-y-2">
              {order.items?.map((item: any, idx: number) => (
                <li key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-[var(--text-secondary)]">{item.qty || item.quantity}x</span>
                    <span className="font-medium text-[var(--text-primary)]">{item.name || item.productName}</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">
                    Rp {((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString('id-ID')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--text-secondary)]">
              <ImageIcon size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Bukti Transfer</span>
            </div>
            {order.paymentProofUrl ? (
              <div className="relative group rounded-lg overflow-hidden border border-[var(--border)] bg-gray-50 flex justify-center">
                <img 
                  src={getMediaUrl(order.paymentProofUrl)} 
                  alt="Bukti Transfer QRIS" 
                  className="max-h-64 object-contain"
                />
                <a 
                  href={getMediaUrl(order.paymentProofUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <ExternalLink size={12} /> Buka Gambar
                  </div>
                </a>
              </div>
            ) : (
              <div className="py-8 text-center text-[var(--text-secondary)] text-sm font-bold bg-gray-50 rounded-lg border border-dashed border-[var(--border)]">
                Tidak ada lampiran bukti transfer.
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 py-3 bg-[var(--bg-main)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl transition-colors"
            >
              Nanti Saja
            </button>
            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Verifikasi Sah
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
