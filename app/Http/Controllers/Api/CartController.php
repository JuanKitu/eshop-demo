<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\CartCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->store_id;
        $calculation = CartCalculationService::calculateCartTotals(
            $storeId, 
            session()->getId(),
            $request->coupon_code,
            $request->shipping_id
        );
        
        $formattedItems = $calculation['items']->map(function ($item) {
            $variants = $item->variants ?: [];
            
            $p = $item->product;
            $vPrice = $p->getVariantPrice($variants);
            $vOriginalPrice = $p->getVariantOriginalPrice($variants);
            
            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $p->name,
                'price' => $vOriginalPrice,
                'sale_price' => $vPrice < $vOriginalPrice ? $vPrice : null,
                'cover_image' => $p->cover_image,
                'quantity' => $item->quantity,
                'stock' => $p->stock,
                'is_active' => $p->is_active,
                'variants' => $item->variants,
                'total' => $item->total,
                'category' => [
                    'id' => $p->category_id,
                    'name' => $p->category->name ?? 'Uncategorized'
                ]
            ];
        });
        
        return response()->json([
            'items' => $formattedItems,
            'count' => $calculation['items']->sum('quantity'),
            'subtotal' => $calculation['subtotal'],
            'discount' => $calculation['discount'],
            'shipping' => $calculation['shipping'],
            'tax' => $calculation['tax'],
            'total' => $calculation['total']
        ]);
    }

    public function add(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'variants' => 'nullable|array'
        ]);
        $product = Product::findOrFail($request->product_id);
        $variants = $request->variants;
        if (isset($variants['variants'])) {
            $variants = $variants['variants'];
        }
        if (!is_array($variants)) $variants = [];

        $query = CartItem::where([
            'store_id' => $request->store_id,
            'product_id' => $request->product_id,
        ]);

        if (Auth::guard('customer')->check()) {
            $query->where('customer_id', Auth::guard('customer')->id());
        } else {
            $query->where('session_id', session()->getId())
                  ->whereNull('customer_id');
        }

        $existingItem = $query->get()->filter(function($item) use ($variants) {
            return ($item->variants ?: []) == $variants;
        })->first();

        if ($existingItem) {
            $existingItem->increment('quantity', $request->quantity);
            $cartItem = $existingItem;
        } else {
            $cartPrice = $product->getVariantPrice($variants);
            $cartOriginalPrice = $product->getVariantOriginalPrice($variants);

            $cartItem = CartItem::create([
                'store_id' => $request->store_id,
                'customer_id' => Auth::guard('customer')->check() ? Auth::guard('customer')->id() : null,
                'session_id' => session()->getId(),
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'variants' => $variants,
                'price' => $cartPrice < $cartOriginalPrice ? $cartPrice : $cartOriginalPrice
            ]);
        }
        return response()->json(['message' => 'Added to cart', 'item' => $cartItem]);
    }

    public function update(Request $request, $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);
        
        $cartItem = $this->getCartItems($request->store_id, $request)->findOrFail($id);
        $cartItem->update(['quantity' => $request->quantity]);
        
        return response()->json(['message' => 'Cart updated']);
    }

    public function remove($id, Request $request)
    {
        $cartItem = $this->getCartItems($request->store_id, $request)->findOrFail($id);
        $cartItem->delete();
        
        return response()->json(['message' => 'Item removed']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'items' => 'required|array'
        ]);

        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if ($product) {
                CartItem::create([
                    'store_id' => $request->store_id,
                    'customer_id' => Auth::guard('customer')->check() ? Auth::guard('customer')->id() : null,
                    'session_id' => session()->getId(),
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $product->getVariantPrice($item['variants'] ?? []) < $product->getVariantOriginalPrice($item['variants'] ?? []) ? $product->getVariantPrice($item['variants'] ?? []) : $product->getVariantOriginalPrice($item['variants'] ?? [])
                ]);
            }
        }

        return response()->json(['message' => 'Cart synced']);
    }

    private function getCartItems($storeId, $request)
    {
        $query = CartItem::where('store_id', $storeId);
        
        if (Auth::guard('customer')->check()) {
            $query->where('customer_id', Auth::guard('customer')->id());
        } else {
            $query->where('session_id', session()->getId())
                  ->whereNull('customer_id');
        }
        
        return $query;
    }
}