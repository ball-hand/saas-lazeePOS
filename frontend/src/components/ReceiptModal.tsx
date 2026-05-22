import { Modal } from './Modal';
import { Printer } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt Details">
      <div className="flex justify-end mb-4">
        <button onClick={handlePrint} className="btn btn-primary no-print">
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      <div id="printable-receipt" className="bg-white text-black p-8 rounded-lg max-w-md mx-auto shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">{receipt.user?.storeName || 'Store Receipt'}</h2>
          <p className="text-sm text-gray-500">Receipt #: {receipt.receiptNumber}</p>
          <p className="text-sm text-gray-500">{new Date(receipt.createdAt).toLocaleString()}</p>
          {receipt.customerName && (
            <p className="text-sm font-medium mt-2">Customer: {receipt.customerName}</p>
          )}
        </div>

        <div className="border-t border-b border-gray-200 py-4 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2">
                    <div className="font-medium">{item.productName}</div>
                    {item.discountApplied > 0 && (
                      <div className="text-xs text-gray-500">Discount: -${parseFloat(item.discountApplied).toFixed(2)}</div>
                    )}
                  </td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right">${parseFloat(item.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${parseFloat(receipt.subtotalAmount).toFixed(2)}</span>
          </div>
          {parseFloat(receipt.discountAmount) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-${parseFloat(receipt.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>${parseFloat(receipt.taxAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${parseFloat(receipt.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-sm">
          <div className="flex justify-between">
            <span>Paid ({receipt.paymentMethod})</span>
            <span>${parseFloat(receipt.paidAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium mt-1">
            <span>Change</span>
            <span>${parseFloat(receipt.changeGiven).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500 font-medium">
          Thank you for your business!
        </div>
      </div>
    </Modal>
  );
}
