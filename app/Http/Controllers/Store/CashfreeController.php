<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Cashfree\Cashfree;

class CashfreeController extends Controller
{
    /**
     * Handle Cashfree webhook for store orders
     */
    public function webhook(Request $request)
    {
        try {            
            $signature = $request->header('x-webhook-signature');
            $timestamp = $request->header('x-webhook-timestamp');
            $rawBody = $request->getContent();
            
            if (!$signature || !$timestamp) {
                Log::error('Missing webhook signature or timestamp');
                return response()->json(['error' => 'Invalid webhook'], 400);
            }
            
            $data = $request->json()->all();
            
            if (!isset($data['type']) || $data['type'] !== 'PAYMENT_SUCCESS_WEBHOOK') {
                return response()->json(['status' => 'ignored']);
            }
            
            $paymentData = $data['data'] ?? [];
            $orderTags = $paymentData['order']['order_tags'] ?? [];
            
            if (!isset($orderTags['store_order_id'])) {
                Log::error('Store order ID not found in webhook data');
                return response()->json(['error' => 'Invalid order data'], 400);
            }
            
            $order = Order::find($orderTags['store_order_id']);
            if (!$order) {
                Log::error('Order not found', ['order_id' => $orderTags['store_order_id']]);
                return response()->json(['error' => 'Order not found'], 404);
            }
            
            // Get store's Cashfree configuration for signature verification
            $cashfreeConfig = getPaymentMethodConfig('cashfree', $order->store->user->id, $order->store_id);
            
            if (!$cashfreeConfig['enabled'] || !$cashfreeConfig['secret_key']) {
                Log::error('Cashfree not configured for store', ['store_id' => $order->store_id]);
                return response()->json(['error' => 'Payment gateway not configured'], 400);
            }
            
            // Verify webhook signature
            $expectedSignature = base64_encode(hash_hmac('sha256', $timestamp . $rawBody, $cashfreeConfig['secret_key'], true));
            
            if (!hash_equals($expectedSignature, $signature)) {
                Log::error('Invalid webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }
            
            // Update order status
            $order->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_details' => array_merge($order->payment_details ?? [], [
                    'cashfree_payment_id' => $paymentData['cf_payment_id'] ?? null,
                    'payment_amount' => $paymentData['payment_amount'] ?? null,
                    'payment_time' => $paymentData['payment_time'] ?? null,
                    'webhook_received_at' => now(),
                ]),
            ]);
            
            return response()->json(['status' => 'success']);
            
        } catch (\Exception $e) {
            Log::error('Store Cashfree webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }
    
    /**
     * Handle Cashfree payment verification for store orders
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'cf_payment_id' => 'nullable|string'
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            
            // Get store's Cashfree configuration
            $cashfreeConfig = getPaymentMethodConfig('cashfree', $order->store->user->id, $order->store_id);
            
            if (!$cashfreeConfig['enabled'] || !$cashfreeConfig['secret_key']) {
                return response()->json(['error' => 'Cashfree not configured'], 400);
            }
            
            // Configure Cashfree SDK
            $cashfree = new Cashfree(
                $cashfreeConfig['mode'] === 'production' ? 1 : 0,
                $cashfreeConfig['public_key'],
                $cashfreeConfig['secret_key'],
                '',
                '',
                '',
                false
            );
            
            $cashfreeOrderId = $order->payment_transaction_id;
            if (!$cashfreeOrderId) {
                return response()->json(['error' => 'Cashfree order ID not found'], 400);
            }
            
            // Fetch order status from Cashfree
            $orderResponse = $cashfree->PGFetchOrder($cashfreeOrderId);
            
            if (!$orderResponse || !isset($orderResponse[0])) {
                return response()->json(['error' => 'Failed to fetch order status'], 400);
            }
            
            $cashfreeOrder = $orderResponse[0];
            
            if ($cashfreeOrder->getOrderStatus() !== 'PAID') {
                return response()->json(['error' => 'Payment not completed'], 400);
            }
            
            // Get payment details
            $paymentsResponse = $cashfree->PGOrderFetchPayments($cashfreeOrderId);
            
            if (!is_array($paymentsResponse) || !isset($paymentsResponse[0]) || !is_array($paymentsResponse[0])) {
                return response()->json(['error' => 'Invalid payment response'], 400);
            }
            
            $payments = $paymentsResponse[0];
            $successfulPayment = null;
            
            foreach ($payments as $payment) {
                if ($payment->getPaymentStatus() === 'SUCCESS') {
                    $successfulPayment = $payment;
                    break;
                }
            }
            
            if (!$successfulPayment) {
                return response()->json(['error' => 'No successful payment found'], 400);
            }
            
            // Update order status
            $order->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_details' => array_merge($order->payment_details ?? [], [
                    'cashfree_payment_id' => $successfulPayment->getCfPaymentId(),
                    'payment_amount' => $successfulPayment->getPaymentAmount(),
                    'payment_time' => $successfulPayment->getPaymentTime(),
                    'verified_at' => now(),
                ]),
            ]);
            
            return response()->json(['success' => true]);
            
        } catch (\Exception $e) {
            Log::error('Store Cashfree payment verification failed', [
                'error' => $e->getMessage(),
                'order_id' => $request->order_id
            ]);
            return response()->json(['error' => 'Payment verification failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Handle success redirect for Cashfree
     */
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            
            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            
            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation.custom', [
                    'orderNumber' => $order->order_number
                ])->with('success', __('Payment completed successfully!'));
            }
            
            return redirect()->route('store.order-confirmation', [
                'storeSlug' => $storeSlug,
                'orderNumber' => $order->order_number
            ])->with('success', __('Payment completed successfully!'));
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.checkout.custom')
                    ->withErrors(['error' => __('Order not found or payment failed')]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Order not found or payment failed')]);
        }
    }
}