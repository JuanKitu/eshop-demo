import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/helpers';

export default function POSReceipt() {
  const { t } = useTranslation();

  const { transaction, settings, storeLogo } = usePage().props as any;
  
  // Format transaction data for receipt
  const receipt = {
    id: transaction.transaction_number,
    date: new Date(transaction.created_at).toLocaleDateString(),
    time: new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    customer: transaction.customer ? `${transaction.customer.first_name} ${transaction.customer.last_name}` : 'Walk-in Customer',
    cashier: settings?.companyName || transaction.cashier.name,
    items: transaction.items.map((item: any) => ({
      id: item.id,
      name: item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name,
      price: parseFloat(item.price),
      quantity: item.quantity
    })),
    subtotal: parseFloat(transaction.subtotal),
    discount: parseFloat(transaction.discount || 0),
    tax: parseFloat(transaction.tax),
    total: parseFloat(transaction.total),
    paymentMethod: transaction.payments[0]?.payment_method || 'Unknown',
    changeAmount: parseFloat(transaction.payments[0]?.change_amount || 0),
    amountPaid: parseFloat(transaction.payments[0]?.amount || transaction.total),
  };

  useEffect(() => {
    // Auto-print based on settings (default true if not set)
    if (settings?.auto_print_receipt !== false) {
      window.print();
    }
  }, []);

  const storeName = settings?.store_name || 'My Store';
  const taxRate = settings?.tax_rate ?? 0;

  return (
    <div className="p-8 max-w-md mx-auto bg-white print:p-0">
      {/* Store Header */}
      <div className="text-center mb-6">
        {/* Show store logo based on setting */}
        {settings?.show_logo_on_receipt !== false && storeLogo && (
          <img
            src={storeLogo.startsWith('http') ? storeLogo : `${window.location.origin}${storeLogo}`}
            alt={storeName}
            className="h-7 mx-auto mb-2 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <h1 className="text-xl font-bold">{storeName}</h1>
      </div>

      {/* Transaction Info */}
      <div className="border-t border-b py-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Receipt #:</span>
          <span>{receipt.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Date:</span>
          <span>{receipt.date} {receipt.time}</span>
        </div>
        {/* Show cashier name based on setting */}
        {settings?.show_cashier_name !== false && (
          <div className="flex justify-between text-sm">
            <span>Cashier:</span>
            <span>{receipt.cashier}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Customer:</span>
          <span>{receipt.customer}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 text-sm">Item</th>
            <th className="text-center py-1 text-sm">Qty</th>
            <th className="text-right py-1 text-sm">Price</th>
            <th className="text-right py-1 text-sm">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item: any) => (
            <tr key={item.id} className="border-b">
              <td className="py-1 text-sm">{item.name}</td>
              <td className="text-center py-1 text-sm">{item.quantity}</td>
              <td className="text-right py-1 text-sm">{formatCurrency(item.price)}</td>
              <td className="text-right py-1 text-sm">{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(receipt.subtotal)}</span>
        </div>
        {receipt.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount:</span>
            <span>-{formatCurrency(receipt.discount)}</span>
          </div>
        )}
        {/* Show tax details based on setting */}
        {settings?.show_tax_details !== false && (
          <div className="flex justify-between text-sm">
            <span>Tax ({taxRate}%):</span>
            <span>{formatCurrency(receipt.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t pt-1">
          <span>Total:</span>
          <span>{formatCurrency(receipt.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t pt-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Payment Method:</span>
          <span className="capitalize">{receipt.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Amount Paid:</span>
          <span>{formatCurrency(receipt.amountPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Change:</span>
          <span>{formatCurrency(receipt.changeAmount)}</span>
        </div>
      </div>

      {/* Footer messages */}
      <div className="text-center text-sm mt-6">
        {settings?.receipt_header && <p className="font-medium">{settings.receipt_header}</p>}
        {settings?.receipt_footer && <p className="text-muted-foreground mt-1">{settings.receipt_footer}</p>}
      </div>
    </div>
  );
}