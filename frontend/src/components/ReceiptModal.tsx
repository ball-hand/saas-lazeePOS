import { Modal } from './Modal';
import { Printer } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any;
}

const fmt = (val: number | string) =>
  'Rp ' + Math.round(parseFloat(String(val || 0))).toLocaleString('id-ID');

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => window.print();

  // Load custom subtitle & footer from settings config
  const storedConfig = localStorage.getItem('pos_receipt_config');
  let receiptSubtitle = 'Sistem Kasir Digital';
  let receiptFooter = 'Terima kasih atas kunjungan Anda!';
  if (storedConfig) {
    try {
      const parsed = JSON.parse(storedConfig);
      receiptSubtitle = parsed.receiptSubtitle || 'Sistem Kasir Digital';
      receiptFooter = parsed.receiptFooter || 'Terima kasih atas kunjungan Anda!';
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran">
      {/* Action bar */}
      <div className="flex justify-between items-center mb-4 no-print">
        <p className="text-sm text-[var(--text-secondary)]">Transaksi berhasil! 🎉</p>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Printer size={15} /> Cetak Struk
        </button>
      </div>

      {/* Printable receipt */}
      <div
        id="printable-receipt"
        className="bg-white text-gray-800 rounded-xl p-5 max-w-sm mx-auto text-sm font-mono shadow-sm border border-gray-100"
      >
        {/* Store header */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            {receipt.tenant?.name || 'LazeePOS'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{receiptSubtitle}</p>
          <div className="border-t border-dashed border-gray-300 my-3" />
          <p className="text-xs text-gray-500 font-semibold">#{receipt.receiptNumber}</p>
          <p className="text-xs text-gray-500">
            {new Date(receipt.createdAt).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {receipt.customerName && (
            <p className="text-xs font-bold text-gray-700 mt-1">Pelanggan: {receipt.customerName}</p>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-dashed border-gray-300 py-2.5 mb-3">
          {(receipt.items || []).map((item: any) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800 flex-1 pr-2">{item.productName}</span>
                <span className="text-gray-600">{fmt(item.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{item.quantity} x {fmt(item.unitPrice)}</span>
                {parseFloat(item.discountApplied) > 0 && (
                  <span className="text-green-600">Diskon -{fmt(item.discountApplied)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>{fmt(receipt.subtotalAmount)}</span>
          </div>
          {parseFloat(receipt.discountAmount) > 0 && (
            <div className="flex justify-between text-xs text-green-600 font-bold">
              <span>Diskon</span>
              <span>-{fmt(receipt.discountAmount)}</span>
            </div>
          )}
          {parseFloat(receipt.taxAmount) > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Pajak</span>
              <span>{fmt(receipt.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base text-gray-900 pt-2 border-t border-dashed border-gray-300 mt-2">
            <span>TOTAL</span>
            <span>{fmt(receipt.totalAmount)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Dibayar ({receipt.paymentMethod === 'cash' ? 'Tunai' : receipt.paymentMethod === 'card' ? 'Kartu' : 'Transfer'})</span>
            <span>{fmt(receipt.paidAmount)}</span>
          </div>
          {parseFloat(receipt.changeGiven) > 0 && (
            <div className="flex justify-between font-bold text-gray-800">
              <span>Kembalian</span>
              <span>{fmt(receipt.changeGiven)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-xs text-gray-400 border-t border-dashed border-gray-300 pt-4">
          <p className="font-bold text-gray-600">{receiptFooter}</p>
          <p className="mt-1">Powered by LazeePOS</p>
        </div>
      </div>
    </Modal>
  );
}
