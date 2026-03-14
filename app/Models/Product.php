<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;
    
    protected static function boot()
    {
        parent::boot();
        
        static::updating(function ($product) {
            // Check if is_active is being changed from false to true
            if ($product->isDirty('is_active') && $product->is_active && !$product->getOriginal('is_active')) {
                $user = $product->store?->user;
                if ($user?->type === 'company' && $user->plan) {
                    $maxProducts = $user->plan->max_products_per_store ?? 0;
                    if ($maxProducts > 0) {
                        $activeProducts = self::where('store_id', $product->store_id)
                            ->where('is_active', true)
                            ->where('id', '!=', $product->id)
                            ->count();
                        
                        if ($activeProducts >= $maxProducts) {
                            throw new \Exception('Cannot activate product. Plan limit of ' . $maxProducts . ' products per store exceeded.');
                        }
                    }
                }
            }
        });
        
        static::updated(function ($product) {
            // Enforce plan limitations after product is activated
            if ($product->is_active && $product->wasChanged('is_active')) {
                $user = $product->store?->user;
                if ($user?->type === 'company') {
                    enforcePlanLimitations($user->fresh());
                }
            }
        });
    }
    
    protected $fillable = [
        'name',
        'sku',
        'description',
        'specifications',
        'details',
        'price',
        'sale_price',
        'stock',
        'cover_image',
        'images',
        'variants',
        'variant_options',
        'custom_fields',
        'category_id',
        'tax_id',
        'store_id',
        'is_active',
        'is_downloadable',
        'downloadable_file',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'is_downloadable' => 'boolean',
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'stock' => 'integer',
        'variants' => 'array',
        'variant_options' => 'array',
        'custom_fields' => 'array',
    ];
    
    /**
     * Get the images as an array
     */
    public function getImagesArrayAttribute()
    {
        if (empty($this->images)) return [];
        return explode(',', $this->images);
    }
    
    /**
     * Get the category that owns the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
    
    /**
     * Get the store that owns the product.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
    
    /**
     * Get the tax that applies to the product.
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
    
    /**
     * Get the reviews for the product.
     */
    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }
    
    /**
     * Get the effective price (sale price if available, otherwise original price) for specific variants.
     */
    public function getVariantPrice($selectedVariants)
    {
        $basePrice = $this->sale_price ?? $this->price;
        if (empty($this->variant_options) || empty($selectedVariants) || empty($this->variants)) {
            return $basePrice;
        }

        $comboParts = [];
        foreach ($this->variants as $v) {
            $name = $v['name'] ?? null;
            if ($name && isset($selectedVariants[$name])) {
                $comboParts[] = $selectedVariants[$name];
            } else {
                return $basePrice; // Incomplete variants
            }
        }
        
        $comboName = implode(' - ', $comboParts);
        
        foreach ($this->variant_options as $option) {
            if (isset($option['name']) && $option['name'] === $comboName) {
                if (!empty($option['sale_price']) && $option['sale_price'] > 0) {
                    return $option['sale_price'];
                }
                if (!empty($option['price']) && $option['price'] > 0) {
                    return $option['price'];
                }
            }
        }
        
        return $basePrice;
    }
    
    /**
     * Get the original price for specific variants (ignoring sale price).
     */
    public function getVariantOriginalPrice($selectedVariants)
    {
        $basePrice = $this->price;
        if (empty($this->variant_options) || empty($selectedVariants) || empty($this->variants)) {
            return $basePrice;
        }

        $comboParts = [];
        foreach ($this->variants as $v) {
            $name = $v['name'] ?? null;
            if ($name && isset($selectedVariants[$name])) {
                $comboParts[] = $selectedVariants[$name];
            } else {
                return $basePrice; // Incomplete variants
            }
        }
        
        $comboName = implode(' - ', $comboParts);
        
        foreach ($this->variant_options as $option) {
            if (isset($option['name']) && $option['name'] === $comboName) {
                if (!empty($option['price']) && $option['price'] > 0) {
                    return $option['price'];
                }
            }
        }
        
        return $basePrice;
    }
}
