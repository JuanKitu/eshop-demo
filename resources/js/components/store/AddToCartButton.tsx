import React from 'react';
import { ShoppingCart, Settings } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { router } from '@inertiajs/react';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { toast } from '@/components/custom-toast';

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    cover_image: string;
    variants?: any;
    stock: number;
    is_active: boolean;
  };
  store: any;
  className?: string;
  isShowOption?: boolean;
  quantity?: number;
  disabled?: boolean;
}

export default function AddToCartButton({
  product,
  store,
  className = '',
  isShowOption = true,
  quantity = 1,
  disabled = false
}: AddToCartButtonProps) {
  const { addToCart, loading } = useCart();

  const parsedVariants = (() => {
    if (!product.variants) return null;
    if (typeof product.variants === 'string') {
      try { return JSON.parse(product.variants); } catch { return product.variants; }
    }
    return product.variants;
  })();

  const hasVariants = parsedVariants && (
    Array.isArray(parsedVariants) ? parsedVariants.length > 0 :
      Object.keys(parsedVariants).length > 0
  );

  const hasSelectedVariants = parsedVariants && !Array.isArray(parsedVariants) &&
    typeof parsedVariants === 'object' && Object.keys(parsedVariants).length > 0 &&
    Object.values(parsedVariants).every(v => v !== null && v !== undefined && v !== '');

  const isOutOfStock = !product.is_active || product.stock <= 0;

  const handleClick = async () => {
    if (isOutOfStock || disabled) return;
    if (hasVariants && !hasSelectedVariants) {
      if (isShowOption) {
        // Redirect to product page to select variants
        router.visit(generateStoreUrl('store.product', store, { id: product.id }));
      } else {
        // On product page, show alert to select variants
        toast.error('Please select product options before adding to cart.');
      }
      return;
    }
    await addToCart(product, product.variants, quantity);
  };

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={`bg-gray-300 text-gray-500 cursor-not-allowed ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center ${(loading || disabled) ? 'opacity-50' : ''} ${className}`}
    >
      {hasVariants && !hasSelectedVariants ? (
        <>
          <Settings className="h-4 w-4 mr-2" />
          {isShowOption ? 'Select Options' : 'Select Options'}
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </button>
  );
}