import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { usePermissions } from '@/hooks/usePermissions';

interface EditOrderProps {
  order: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      id: number;
      productId: number;
      name: string;
      quantity: number;
      price: number;
      variants?: Record<string, string>;
    }>;
    summary: {
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
    };
    shippingMethodId: number;
    trackingNumber?: string;
    notes?: string;
  };
  customers: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  products: Array<{
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    variants: Array<{
      name: string;
      values: string[];
    }>;
    variant_options?: Array<{
      id: string;
      name: string;
      price: string | number;
      sale_price?: string | number;
    }>;
  }>;
  shippingMethods: Array<{
    id: number;
    name: string;
    cost: number;
  }>;
}

export default function EditOrder({ order, customers, products, shippingMethods }: EditOrderProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [orderItems, setOrderItems] = useState(order.items.map(item => {
    let itemVariants = {};
    if (typeof item.variants === 'string') {
      try {
        itemVariants = JSON.parse(item.variants);
      } catch (e) {
        itemVariants = {};
      }
    } else {
      itemVariants = item.variants || {};
    }

    return {
      ...item,
      variants: itemVariants
    };
  }));
  const [formData, setFormData] = useState({
    status: order.status,
    payment_status: order.paymentStatus,
    tracking_number: order.trackingNumber || '',
    notes: order.notes || '',
    items: orderItems,
    summary: order.summary,
    shippingMethodId: order.shippingMethodId,
  });

  // Update summary when items change or shipping changes
  React.useEffect(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = order.summary.subtotal > 0 ? (order.summary.tax / order.summary.subtotal) : 0.1;
    const tax = subtotal * taxRate;
    const total = subtotal + tax + (formData.summary?.shipping || 0);

    setFormData(prev => ({
      ...prev,
      items: orderItems,
      summary: {
        ...prev.summary,
        subtotal,
        tax,
        total
      }
    }));
  }, [orderItems, formData.summary?.shipping]);

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('orders.index'))
    }
  ];

  if (hasPermission('edit-orders')) {
    pageActions.push({
      label: t('Update Order'),
      icon: <Save className="h-4 w-4" />,
      variant: 'default' as any,
      onClick: () => {
        router.put(route('orders.update', order.id), formData);
      }
    });
  }

  const addOrderItem = () => {
    setOrderItems([...orderItems, { id: Date.now(), productId: 0, name: '', quantity: 1, price: 0, variants: {} }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  return (
    <PageTemplate
      title={t('Edit Order') + ' ' + order.orderNumber}
      description={t('Modify order status, items, and shipping details')}
      url="/orders/edit"
      actions={pageActions as any}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Order Management'), href: route('orders.index') },
        { title: t('Edit Order') }
      ]}
    >
      <div className="space-y-6">
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customer">{t('Customer')}</TabsTrigger>
            <TabsTrigger value="items">{t('Items')}</TabsTrigger>
            <TabsTrigger value="shipping">{t('Shipping')}</TabsTrigger>
            <TabsTrigger value="payment">{t('Payment')}</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Customer Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">{t('Select Customer')}</Label>
                  <Select defaultValue={order.customer.id ? order.customer.id.toString() : ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select Customer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">{t('Customer Name')}</Label>
                    <Input id="customer_name" defaultValue={order.customer.name} />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">{t('Email Address')}</Label>
                    <Input id="customer_email" type="email" defaultValue={order.customer.email} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_phone">{t('Phone Number')}</Label>
                    <Input id="customer_phone" defaultValue={order.customer.phone} />
                  </div>
                  <div>
                    <Label htmlFor="order_notes">{t('Order Notes')}</Label>
                    <Textarea
                      id="order_notes"
                      defaultValue={order.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('Order Items')}</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Add Item')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{t('Item {{number}}', { number: index + 1 })}</h4>
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>{t('Product')}</Label>
                        <Select
                          defaultValue={item.productId ? item.productId.toString() : ''}
                          onValueChange={(value) => {
                            const newItems = [...orderItems];
                            const productId = parseInt(value);
                            const product = products.find(p => p.id === productId) as any;
                            newItems[index].productId = productId;
                            newItems[index].name = product?.name || '';

                            // Use sale_price if available, otherwise base price (consistent with theme)
                            const initialPrice = product ? (product.sale_price ? parseFloat(String(product.sale_price)) : parseFloat(String(product.price))) : 0;
                            newItems[index].price = initialPrice;
                            newItems[index].variants = {};

                            setOrderItems(newItems);
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ${product.price.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Show variant selection if product has variants */}
                        {item.productId > 0 && products.find(p => p.id === item.productId)?.variants && (products.find(p => p.id === item.productId)?.variants as any[]).length > 0 && (
                          <div className="mt-2 space-y-2">
                            {(products.find(p => p.id === item.productId)?.variants as any[]).map((variant, vIndex) => (
                              <div key={vIndex}>
                                <Label className="text-xs">{variant.name}</Label>
                                <Select
                                  value={((item.variants as Record<string, string>) || {})[variant.name] || ''}
                                  onValueChange={(value) => {
                                    const newItems = [...orderItems];
                                    let currentVariants = newItems[index].variants;

                                    // Ensure currentVariants is an object
                                    if (typeof currentVariants === 'string') {
                                      try {
                                        currentVariants = JSON.parse(currentVariants);
                                      } catch {
                                        currentVariants = {};
                                      }
                                    } else if (!currentVariants) {
                                      currentVariants = {};
                                    }

                                    const currentVariantsObj = (typeof currentVariants === 'string' ? JSON.parse(currentVariants) : currentVariants) || {};
                                    const updatedVariants: Record<string, string> = { ...(currentVariantsObj as Record<string, string>), [variant.name]: value };
                                    newItems[index].variants = updatedVariants;

                                    // Calculate variant price if all variants are selected
                                    const product = products.find(p => p.id === item.productId);
                                    if (product && product.variants && product.variant_options) {
                                      const comboParts: string[] = [];
                                      let allSelected = true;
                                      product.variants.forEach(v => {
                                        const selectedVal = (updatedVariants as Record<string, string>)[v.name];
                                        if (selectedVal) {
                                          comboParts.push(selectedVal);
                                        } else {
                                          allSelected = false;
                                        }
                                      });

                                      if (allSelected) {
                                        const comboName = comboParts.join(' - ');
                                        const matchingOption = product.variant_options.find((opt: any) =>
                                          opt.name?.toLowerCase() === comboName.toLowerCase() ||
                                          opt.name?.toLowerCase() === comboParts.join('-').toLowerCase() ||
                                          opt.variant?.toLowerCase() === comboName.toLowerCase()
                                        );

                                        if (matchingOption) {
                                          const vPrice = parseFloat(String(matchingOption.price || 0));
                                          const vSalePrice = matchingOption.sale_price ? parseFloat(String(matchingOption.sale_price)) : 0;

                                          // Prioritize sale price if it exists and is > 0
                                          if (vSalePrice > 0) {
                                            newItems[index].price = vSalePrice;
                                          } else if (vPrice > 0) {
                                            newItems[index].price = vPrice;
                                          } else {
                                            newItems[index].price = product.sale_price ? parseFloat(String(product.sale_price)) : parseFloat(String(product.price));
                                          }
                                        } else {
                                          // If no specific variant option found, revert to base product price
                                          newItems[index].price = product.sale_price ? parseFloat(String(product.sale_price)) : parseFloat(String(product.price));
                                        }
                                      } else {
                                        // If not all variants are selected, revert to base product price
                                        newItems[index].price = product.sale_price ? parseFloat(String(product.sale_price)) : parseFloat(String(product.price));
                                      }
                                    } else if (product) {
                                      // If product has no variant options, use base effective price
                                      newItems[index].price = product.sale_price ? parseFloat(String(product.sale_price)) : parseFloat(String(product.price));
                                    }

                                    setOrderItems(newItems);
                                    setFormData(prev => ({ ...prev, items: newItems }));
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder={t('Select {{name}}', { name: variant.name })} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(variant.values as any[]).map((value: any, valueIndex: number) => (
                                      <SelectItem key={valueIndex} value={value}>
                                        {value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>{t('Quantity')}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[index].quantity = parseInt(e.target.value) || 1;
                            setOrderItems(newItems);
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>{t('Price')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[index].price = parseFloat(e.target.value) || 0;
                            setOrderItems(newItems);
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Shipping Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping_method">{t('Shipping Method')}</Label>
                  <Select
                    defaultValue={order.shippingMethodId.toString()}
                    onValueChange={(value) => {
                      const method = shippingMethods.find(m => m.id.toString() === value);
                      if (method) {
                        setFormData(prev => ({
                          ...prev,
                          shippingMethodId: parseInt(value),
                          summary: {
                            ...prev.summary,
                            shipping: method.cost
                          }
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name} - ${method.cost.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shipping_address">{t('Shipping Address')}</Label>
                  <Textarea
                    id="shipping_address"
                    defaultValue={order.shippingAddress.address}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_city">{t('City')}</Label>
                    <Input id="shipping_city" defaultValue={order.shippingAddress.city} />
                  </div>
                  <div>
                    <Label htmlFor="shipping_postal">{t('Postal Code')}</Label>
                    <Input id="shipping_postal" defaultValue={order.shippingAddress.postalCode} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tracking_number">{t('Tracking Number')}</Label>
                  <Input
                    id="tracking_number"
                    defaultValue={order.trackingNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Payment Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">{t('Payment Method')}</Label>
                    <Select defaultValue={order.paymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">{t('Credit Card')}</SelectItem>
                        <SelectItem value="paypal">{t('PayPal')}</SelectItem>
                        <SelectItem value="bank_transfer">{t('Bank Transfer')}</SelectItem>
                        <SelectItem value="cash">{t('Cash on Delivery')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_status">{t('Payment Status')}</Label>
                    <Select defaultValue={order.paymentStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                        <SelectItem value="paid">{t('Paid')}</SelectItem>
                        <SelectItem value="failed">{t('Failed')}</SelectItem>
                        <SelectItem value="refunded">{t('Refunded')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="subtotal">{t('Subtotal')}</Label>
                    <Input id="subtotal" type="number" step="0.01" value={formData.summary.subtotal.toFixed(2)} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="tax">{t('Tax Amount')}</Label>
                    <Input id="tax" type="number" step="0.01" value={formData.summary.tax.toFixed(2)} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="total">{t('Total Amount')}</Label>
                    <Input id="total" type="number" step="0.01" value={formData.summary.total.toFixed(2)} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="order_status">{t('Order Status')}</Label>
                  <Select defaultValue={order.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('Pending')}</SelectItem>
                      <SelectItem value="processing">{t('Processing')}</SelectItem>
                      <SelectItem value="shipped">{t('Shipped')}</SelectItem>
                      <SelectItem value="delivered">{t('Delivered')}</SelectItem>
                      <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                      <SelectItem value="completed">{t('Completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTemplate >
  );
}