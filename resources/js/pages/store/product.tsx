import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import storeTheme from '@/config/store-theme';

import { Star, ShoppingCart, Heart, Share2, ChevronRight, Minus, Plus, Check, Info } from 'lucide-react';
import ProductSlider from '@/components/store/ProductSlider';
import ImageGallery from '@/components/store/ImageGallery';
import { getImageUrl } from '@/utils/image-helper';
import { useCart } from '@/contexts/CartContext';
import AddToCartButton from '@/components/store/AddToCartButton';
import { formatCurrency } from '@/utils/currency-formatter';
import { toast } from '@/components/custom-toast';

interface ProductVariant {
  name: string;
  values: string[];
}

interface ProductImage {
  id: string;
  url: string;
}

interface ProductProps {
  product: {
    id: number;
    name: string;
    sku: string;
    description: string;
    specifications?: string;
    details?: string;
    price: number;
    sale_price?: number | null;
    stock: number;
    cover_image: string;
    images?: string;
    category?: { id: number; name: string };
    is_active: boolean;
    variants?: ProductVariant[];
    variant_options?: any[];
    custom_fields?: Record<string, any>;
    reviews?: Array<{
      id: number;
      rating: number;
      title: string;
      content: string;
      customer_name: string;
      created_at: string;
      store_response?: string;
    }>;
    average_rating?: number;
    total_reviews?: number;
  };
  relatedProducts?: any[];
  store?: any;
  storeContent?: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customPages?: Array<{
    id: number;
    name: string;
    href: string;
  }>;
}

function DefaultProductDetailBody({
  product,
  relatedProducts = [],
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
  props
}: ProductProps & { props: any }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('description');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState(product.reviews || []);
  const [totalReviews, setTotalReviews] = useState(product.total_reviews || 0);
  const [averageRating, setAverageRating] = useState(product.average_rating || 0);

  const theme = store?.theme || 'default';
  const storeSettings = props.storeSettings || {};
  const currencies = props.currencies || [];
  const storeSlug = props.store?.slug || props.theme || 'home-accessories';
  // Parse images from comma-separated string and ensure cover image is included
  const productImages: ProductImage[] = (() => {
    let images: ProductImage[] = [];

    // Add cover image first if it exists
    if (product.cover_image) {
      images.push({ id: '0', url: product.cover_image });
    }

    // Parse additional images if they exist (comma-separated)
    if (product.images) {
      const imageUrls = product.images.split(',').map(url => url.trim()).filter(url => url);
      imageUrls.forEach((url, index) => {
        // Avoid duplicates with cover image
        if (url !== product.cover_image) {
          images.push({ id: (index + 1).toString(), url });
        }
      });
    }

    // Fallback to placeholder if no images
    if (images.length === 0) {
      images.push({ id: '1', url: `https://placehold.co/600x600?text=${encodeURIComponent(product.name)}` });
    }

    return images;
  })();

  const isOnSale = product.sale_price && parseFloat(product.sale_price as any) < parseFloat(product.price as any);
  // Parse variants safely
  const productVariants = (() => {
    if (!product.variants) return [];
    if (Array.isArray(product.variants)) return product.variants;
    try {
      return JSON.parse(product.variants);
    } catch (error) {
      return [];
    }
  })();

  const hasVariants = productVariants && productVariants.length > 0;

  // Check if all required variants are selected
  const allVariantsSelected = !hasVariants ||
    (productVariants && productVariants.length > 0 && productVariants.every((variant: any) =>
      selectedVariants[variant.name] !== undefined &&
      selectedVariants[variant.name] !== null &&
      selectedVariants[variant.name] !== ''
    ));

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (product.stock && value > product.stock) return;
    setQuantity(value);
  };

  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!isInStock || !allVariantsSelected) return;

    setIsAddingToCart(true);
    try {
      await addToCart(product, selectedVariants, quantity);
      // toast.success('Product added to cart successfully!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // toast.error('Failed to add product to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getVariantPrices = () => {
    if (!hasVariants) {
      return {
        price: parseFloat(product.price as any),
        sale_price: product.sale_price ? parseFloat(product.sale_price as any) : null,
        stock: product.stock
      };
    }

    const variantOptions = (() => {
      if (!product.variant_options) return [];
      if (Array.isArray(product.variant_options)) return product.variant_options;
      try { return JSON.parse(product.variant_options as any); } catch { return []; }
    })();

    if (!allVariantsSelected) {
      return {
        price: parseFloat(product.price as any),
        sale_price: product.sale_price ? parseFloat(product.sale_price as any) : null,
        stock: product.stock,
        incomplete: true
      };
    }

    const comboParts = productVariants.map((v: any) => selectedVariants[v.name]);
    const comboName = comboParts.join(' - ');
    const comboDashName = comboParts.join('-');

    const matchingOption = variantOptions.find((opt: any) =>
      opt.name?.toLowerCase() === comboName.toLowerCase() ||
      opt.name?.toLowerCase() === comboDashName.toLowerCase() ||
      opt.variant?.toLowerCase() === comboName.toLowerCase()
    );

    if (matchingOption) {
      const vPrice = parseFloat(matchingOption.price);
      const vSalePrice = matchingOption.sale_price ? parseFloat(matchingOption.sale_price) : null;

      return {
        price: vPrice > 0 ? vPrice : parseFloat(product.price as any),
        sale_price: (vSalePrice && vSalePrice > 0) ? vSalePrice : null,
        stock: matchingOption.stock !== undefined ? parseInt(matchingOption.stock) : (matchingOption.quantity !== undefined ? parseInt(matchingOption.quantity) : product.stock)
      };
    }

    return {
      price: parseFloat(product.price as any),
      sale_price: product.sale_price ? parseFloat(product.sale_price as any) : null,
      stock: product.stock
    };
  };

  const { price: displayPrice, sale_price: displaySalePrice, stock: displayStock } = getVariantPrices();
  const isInStock = (displayStock !== undefined ? displayStock : product.stock) > 0 && product.is_active;
  const isDisplayOnSale = displaySalePrice !== null && displaySalePrice !== undefined && displaySalePrice > 0 && displaySalePrice < displayPrice;

  const handleAddToWishlist = () => {
    // Wishlist implementation
  };

  // Parse custom fields safely
  const customFields = (() => {
    if (!product.custom_fields) return [];
    if (Array.isArray(product.custom_fields)) return product.custom_fields;
    if (typeof product.custom_fields === 'object') {
      return Object.entries(product.custom_fields).map(([key, value]) => ({
        name: key,
        value: value
      }));
    }
    try {
      const parsed = JSON.parse(product.custom_fields);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          name: key,
          value: value
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  })();

  const hasCustomFields = customFields && customFields.length > 0;

  const getProductImageUrl = (path: string): string => {
    if (!path) return `https://placehold.co/600x600?text=${encodeURIComponent(product.name)}`;
    if (path.startsWith('http')) return path;
    return getImageUrl(path);
  };

  return (
    <>
      <Head title={`${product.name} - ${store.name || 'Store'}`} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link href={generateStoreUrl('store.home', store)} className="text-gray-500 hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            {product.category && (
              <>
                <Link href={generateStoreUrl('store.products', store, { category: product.category.id })} className="text-gray-500 hover:text-primary">
                  {product.category.name}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
              </>
            )}
            <span className="text-gray-800 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="sticky top-24">
              <div className="bg-white rounded-xl overflow-hidden shadow-md">
                <ImageGallery images={productImages.map(img => getProductImageUrl(img.url))} />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {product.category && (
                <Link
                  href={generateStoreUrl('store.products', store, { category: product.category.id })}
                  className="inline-block text-sm text-primary mb-2"
                >
                  {product.category.name}
                </Link>
              )}

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              {totalReviews > 0 && (
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= Math.floor(Number(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ({Number(averageRating).toFixed(1)}) - {totalReviews} Reviews
                  </span>
                </div>
              )}

              <div className="mb-6">
                {isDisplayOnSale ? (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary">{formatCurrency(displaySalePrice || 0, storeSettings, currencies)}</span>
                    <span className="text-gray-500 text-lg line-through ml-3">{formatCurrency(displayPrice, storeSettings, currencies)}</span>
                    <span className="ml-3 bg-primary/10 text-primary text-sm px-2 py-1 rounded">
                      {displayPrice > 0 && Math.round(((displayPrice - (displaySalePrice || 0)) / displayPrice) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">{formatCurrency(displayPrice, storeSettings, currencies)}</span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-600">
                  {product.description?.replace(/<[^>]*>/g, '').substring(0, 200)}
                  {product.description && product.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                </p>
              </div>

              <div className="mb-6 flex items-center">
                {isInStock ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span>In Stock ({product.stock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <Info className="h-5 w-5 mr-2" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {product.sku && (
                <div className="mb-6 text-sm text-gray-500">
                  SKU: {product.sku}
                </div>
              )}

              {hasVariants && productVariants && (
                <div className="mb-6 space-y-4">
                  {productVariants.map((variant: any) => (
                    <div key={variant.name}>
                      <h3 className="text-sm font-medium mb-2">{variant.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {variant.values && Array.isArray(variant.values) && variant.values.map((value: any) => (
                          <button
                            key={value}
                            onClick={() => handleVariantChange(variant.name, value)}
                            className={`px-4 py-2 border rounded-md text-sm ${selectedVariants[variant.name] === value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-300 hover:border-primary'
                              }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-16 text-center border-t border-b border-gray-300 py-2 focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100"
                    disabled={product.stock !== null && quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !isInStock || (hasVariants && !allVariantsSelected)}
                  className={`w-full py-3 rounded-md text-sm font-semibold transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${!isInStock || (hasVariants && !allVariantsSelected)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-primary text-white hover:bg-blue-700'
                    } ${isAddingToCart ? 'opacity-70' : ''}`}
                >
                  {isAddingToCart ? (
                    'Adding...'
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      {!isInStock ? 'Out of Stock' : (hasVariants && !allVariantsSelected ? 'Select Options' : 'Add to Cart')}
                    </>
                  )}
                </button>

                <button
                  onClick={() => {/* wishlist toggle */ }}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  aria-label="Add to wishlist"
                >
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>

                <button
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  aria-label="Share product"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {['description', 'specifications', 'details', 'advanced', 'reviews'].map((tab) => {
                    if (tab === 'specifications' && !product.specifications) return null;
                    if (tab === 'details' && !product.details) return null;
                    if (tab === 'advanced' && !hasCustomFields) return null;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-4 text-sm font-medium whitespace-nowrap capitalize ${activeTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="py-6">
                  {activeTab === 'description' && (
                    <div className="prose max-w-none max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                  )}
                  {activeTab === 'specifications' && (
                    <div className="prose max-w-none max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.specifications || '' }} />
                  )}
                  {activeTab === 'details' && (
                    <div className="prose max-w-none max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.details || '' }} />
                  )}
                  {activeTab === 'advanced' && (
                    <div className="space-y-4">
                      {customFields.map((field: any, i: number) => (
                        <div key={i} className="flex border-b border-gray-100 py-2">
                          <span className="font-medium w-1/3">{field.name}:</span>
                          <span className="text-gray-600">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Customer Reviews</h3>
                        <button
                          onClick={() => isLoggedIn ? setShowReviewModal(true) : window.location.href = generateStoreUrl('store.login', store)}
                          className="text-sm text-primary font-medium hover:underline"
                        >
                          Write a Review
                        </button>
                      </div>
                      {productReviews.length > 0 ? (
                        productReviews.map((r: any) => (
                          <div key={r.id} className="border-b border-gray-100 pb-4">
                            <div className="flex items-center mb-1">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                              <span className="ml-2 text-sm font-medium">{r.customer_name}</span>
                            </div>
                            <p className="text-sm font-semibold">{r.title}</p>
                            <p className="text-sm text-gray-600">{r.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No reviews yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <ProductSlider
              title="Related Products"
              products={relatedProducts}
              viewAllLink={generateStoreUrl('store.products', store)}
              storeSettings={storeSettings}
              currencies={currencies}
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Submit Your Review</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (reviewRating === 0) return toast.error('Check rating');
              setIsSubmittingReview(true);
              try {
                const res = await fetch(route('api.reviews.store'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                  body: JSON.stringify({ product_id: product.id, rating: reviewRating, title: reviewTitle, content: reviewContent })
                });
                const data = await res.json();
                if (data.success) {
                  toast.success('Submitted!');
                  setShowReviewModal(false);
                } else toast.error(data.message);
              } catch { toast.error('Error'); } finally { setIsSubmittingReview(false); }
            }}>
              {/* Rating select */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)}>
                    <Star className={`h-6 w-6 ${s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Title" required className="w-full border p-2 mb-4 rounded" />
              <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} placeholder="Content" required rows={4} className="w-full border p-2 mb-4 rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                <button type="submit" disabled={isSubmittingReview} className="px-4 py-2 bg-primary text-white rounded">
                  {isSubmittingReview ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function DefaultProductDetailContent(props: any) {
  return (
    <StoreLayout
      storeName={props.store.name || storeTheme.store.name}
      logo={props.store.logo || storeTheme.store.logo}
      cartCount={props.cartCount}
      wishlistCount={props.wishlistCount}
      isLoggedIn={props.isLoggedIn}
      customPages={props.customPages}
      storeContent={props.storeContent}
      storeId={props.store.id || 1}
      theme={props.store.theme || props.theme}
    >
      <DefaultProductDetailBody {...props} />
    </StoreLayout>
  );
}

export default function ProductDetail(props: ProductProps & { theme?: string }) {
  const page = usePage();
  const { store, theme = 'default' } = props;
  const actualTheme = store?.theme || theme;

  const [ThemeProductDetailPage, setThemeProductDetailPage] = React.useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadThemeProductDetailPage = async () => {
      if (actualTheme === 'default' || actualTheme === 'home-accessories') {
        setThemeProductDetailPage(null);
        setIsLoading(false);
        return;
      }

      try {
        let module;
        switch (actualTheme) {
          case 'beauty-cosmetics': module = await import('@/pages/store/beauty-cosmetics/BeautyProductDetail'); break;
          case 'fashion': module = await import('@/pages/store/fashion/FashionProductDetail'); break;
          case 'electronics': module = await import('@/pages/store/electronics/ElectronicsProductDetail'); break;
          case 'jewelry': module = await import('@/pages/store/jewelry/JewelryProductDetail'); break;
          case 'watches': module = await import('@/pages/store/watches/WatchesProductDetail'); break;
          case 'furniture-interior': module = await import('@/pages/store/furniture-interior/FurnitureProductDetail'); break;
          case 'cars-automotive': module = await import('@/pages/store/cars-automotive/CarsProductDetail'); break;
          case 'baby-kids': module = await import('@/pages/store/baby-kids/BabyKidsProductDetail'); break;
          case 'perfume-fragrances': module = await import('@/pages/store/perfume-fragrances/PerfumeProductDetail'); break;
          default: setThemeProductDetailPage(null); setIsLoading(false); return;
        }
        setThemeProductDetailPage(() => module.default);
      } catch {
        setThemeProductDetailPage(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemeProductDetailPage();
  }, [actualTheme]);

  if (isLoading) return null;
  if (ThemeProductDetailPage) return <ThemeProductDetailPage {...props} />;

  return <DefaultProductDetailContent {...props} props={page.props} />;
}