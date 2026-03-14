<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class ToyyibPayController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            
            $status_id = $request->input('status_id');
            $billCode = $request->input('billcode');

            // Find the order
            $order = null;
            if ($billCode) {
                $order = Order::where('payment_transaction_id', $billCode)->first();
            }

            if (!$order && $orderNumber) {
                $order = Order::where('order_number', $orderNumber)->first();
            }

            if (!$order) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout.custom')
                        ->withErrors(['error' => __('Order not found')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Order not found')]);
            }

            if ($status_id == '1') {
                if ($order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'processing'
                    ]);
                }

                if ($isCustomDomain) {
                    return redirect()->route('store.order-confirmation.custom', ['orderNumber' => $order->order_number])->with('success', __('Payment successful!'));
                }
                return redirect()->route('store.order-confirmation', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number])->with('success', __('Payment successful!'));
            }

            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation.custom', ['orderNumber' => $order->order_number])->with('error', __('Payment failed or was cancelled.'));
            }
            return redirect()->route('store.order-confirmation', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number])->with('error', __('Payment failed or was cancelled.'));
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.checkout.custom')
                    ->withErrors(['error' => __('Payment verification failed: ') . $e->getMessage()]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Payment verification failed: ') . $e->getMessage()]);
        }
    }

    public function callback(Request $request)
    {
        $status_id = $request->input('status_id');
        $billCode = $request->input('billcode');
        $externalReference = $request->input('order_id');

        if ($status_id == '1') {
            $order = null;
            if ($billCode) {
                $order = Order::where('payment_transaction_id', $billCode)->first();
            }

            if (!$order && $externalReference) {
                $order = Order::where('payment_details->external_reference', $externalReference)->first();
            }
            
            if ($order && $order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'processing'
                ]);
            }
        }
        
        return response('OK', 200);
    }
}
