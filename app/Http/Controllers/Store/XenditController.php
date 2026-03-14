<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;

class XenditController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            
            // Find the order
            $order = Order::where('order_number', $orderNumber)->firstOrFail();

            $xenditConfig = getPaymentMethodConfig('xendit', $store->user->id, $store->id);
            
            $response = \Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($xenditConfig['api_key'] . ':'),
            ])->get('https://api.xendit.co/v2/invoices/' . ($order->payment_details['xendit_invoice_id'] ?? ''));

            if ($response->successful()) {
                $result = $response->json();
                if ($result['status'] === 'PAID' || $result['status'] === 'SETTLED') {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'processing'
                    ]);
                    
                    if ($isCustomDomain) {
                        return redirect()->route('store.order-confirmation.custom', ['orderNumber' => $order->order_number])->with('success', __('Payment successful!'));
                    }
                    return redirect()->route('store.order-confirmation', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number])->with('success', __('Payment successful!'));
                }
            }

            if ($order->payment_status === 'paid') {
                if ($isCustomDomain) {
                    return redirect()->route('store.order-confirmation.custom', ['orderNumber' => $order->order_number]);
                }
                return redirect()->route('store.order-confirmation', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number]);
            }

            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation.custom', ['orderNumber' => $order->order_number])->with('info', __('Payment is being processed.'));
            }
            return redirect()->route('store.order-confirmation', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number])->with('info', __('Payment is being processed.'));
            
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
        $payload = $request->all();
        $externalId = $payload['external_id'] ?? null;
        $status = $payload['status'] ?? null;

        if ($externalId && ($status === 'PAID' || $status === 'SETTLED')) {
            // Extract order ID from external_id (store_order_{id}_{time})
            $parts = explode('_', $externalId);
            if (count($parts) >= 3) {
                $orderId = $parts[2];
                $order = Order::find($orderId);
                if ($order && $order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'processing'
                    ]);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
