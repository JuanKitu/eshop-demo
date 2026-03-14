<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Store\AuthController;
use App\Http\Controllers\Store\OrderController;
use App\Http\Controllers\Store\ProfileController;
use App\Http\Controllers\PWAController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\Store\StripeController;
use App\Http\Controllers\Store\PayPalController;
use App\Http\Controllers\Store\PayFastController;
use App\Http\Controllers\Store\MercadoPagoController;
use App\Http\Controllers\Store\PaystackController;
use App\Http\Controllers\Store\FlutterwaveController;
use App\Http\Controllers\Store\PayTabsController;
use App\Http\Controllers\Store\CashfreeController;
use App\Http\Controllers\Store\CoinGateController;
use App\Http\Controllers\Store\TapController;
use App\Http\Controllers\Store\XenditController;
use App\Http\Controllers\Store\ToyyibPayController;


// PWA routes (outside middleware to avoid conflicts)
Route::get('store/{storeSlug}/manifest.json', [PWAController::class, 'manifest'])->name('store.pwa.manifest');
Route::get('store/{storeSlug}/service-worker', [PWAController::class, 'serviceWorker'])->name('store.pwa.sw');

// Direct routes for custom domain access
// Note: GET '/' for custom domains is handled directly by DomainResolver middleware (global)
Route::middleware(['domain.resolver'])->group(function () {
    Route::post('customer/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('customer/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/store-logout', [AuthController::class, 'logout'])->name('store.logout');
    // Order routes
    Route::post('/customer-order/place', [OrderController::class, 'placeOrder'])->name('store.order.place.custom');
    Route::get('/checkout', [ThemeController::class, 'checkout'])->name('store.checkout.custom');
    Route::get('/customer-order/success/{orderNumber}', [ThemeController::class, 'orderConfirmation'])->name('store.order.success.custom');
    Route::get('/order-confirmation/{orderNumber}', [ThemeController::class, 'orderConfirmation'])->name('store.order-confirmation.custom');

    Route::post('/customer-cashfree/verify-payment', [CashfreeController::class, 'verifyPayment'])->name('store.cashfree.verify-payment.custom');
    Route::post('/razorpay/verify-payment', [\App\Http\Controllers\Store\RazorpayController::class, 'verifyPayment'])->name('store.razorpay.verify.custom');
    Route::post('/razorpay/webhook', [\App\Http\Controllers\Store\RazorpayController::class, 'webhook'])->name('store.razorpay.webhook.custom');
    Route::post('/mercadopago/callback', [\App\Http\Controllers\Store\MercadoPagoController::class, 'callback'])->name('store.mercadopago.callback.custom');
    Route::post('/payfast/callback', [\App\Http\Controllers\Store\PayFastController::class, 'callback'])->name('store.payfast.callback.custom');
    Route::post('/cashfree/webhook', [\App\Http\Controllers\Store\CashfreeController::class, 'webhook'])->name('store.cashfree.webhook.custom');
    Route::post('/paytabs/callback', [\App\Http\Controllers\Store\PayTabsController::class, 'callback'])->name('store.paytabs.callback.custom');
    Route::post('/coingate/callback', [\App\Http\Controllers\Store\CoinGateController::class, 'callback'])->name('store.coingate.callback.custom');
    Route::post('/tap/callback', [\App\Http\Controllers\Store\TapController::class, 'callback'])->name('store.tap.callback.custom');
    Route::match(['GET', 'POST'], '/coingate/payment', [\App\Http\Controllers\Store\CoinGateController::class, 'processPayment'])->name('store.coingate.payment.custom');
    Route::match(['GET', 'POST'], '/tap/payment', [\App\Http\Controllers\Store\TapController::class, 'processPayment'])->name('store.tap.payment.custom');

    Route::get('/xendit/success/{orderNumber}', [XenditController::class, 'success'])->name('store.xendit.success.custom');
    Route::post('/xendit/callback', [XenditController::class, 'callback'])->name('store.xendit.callback.custom');
    Route::get('/toyyibpay/success/{orderNumber}', [ToyyibPayController::class, 'success'])->name('store.toyyibpay.success.custom');
    Route::post('/toyyibpay/callback', [ToyyibPayController::class, 'callback'])->name('store.toyyibpay.callback.custom');

    // Additional Payment Success Routes for Custom Domains
    Route::get('/stripe/success/{orderNumber}', [StripeController::class, 'success'])->name('store.stripe.success.custom');
    Route::get('/paypal/success/{orderNumber}', [PayPalController::class, 'success'])->name('store.paypal.success.custom');
    Route::get('/payfast/success/{orderNumber}', [PayFastController::class, 'success'])->name('store.payfast.success.custom');
    Route::get('/mercadopago/success/{orderNumber}', [MercadoPagoController::class, 'success'])->name('store.mercadopago.success.custom');
    Route::get('/paystack/success/{orderNumber}', [PaystackController::class, 'success'])->name('store.paystack.success.custom');
    Route::get('/flutterwave/success/{orderNumber}', [FlutterwaveController::class, 'success'])->name('store.flutterwave.success.custom');
    Route::get('/paytabs/success/{orderNumber}', [PayTabsController::class, 'success'])->name('store.paytabs.success.custom');
    Route::get('/customer-cashfree/success/{orderNumber}', [CashfreeController::class, 'success'])->name('store.cashfree.success.custom');
    Route::get('/coingate/success/{orderNumber}', [CoinGateController::class, 'success'])->name('store.coingate.success.custom');
    Route::get('/tap/success/{orderNumber}', [TapController::class, 'success'])->name('store.tap.success.custom');
});

// Store frontend routes with store prefix
Route::prefix('{storeSlug?}')->middleware('store.status')->group(function () {
    // Main store routes
    
    Route::get('/product-list', [ThemeController::class, 'products'])->name('store.products');
    Route::get('/product/{id}', [ThemeController::class, 'product'])->name('store.product');
    Route::get('/category/{slug}', [ThemeController::class, 'category'])->name('store.category');
    Route::get('/wishlist', [ThemeController::class, 'wishlist'])->name('store.wishlist');
    Route::get('/cart', [ThemeController::class, 'cart'])->name('store.cart');
    Route::get('/page/{slug}', [ThemeController::class, 'customPage'])->name('store.page');
    
    // Auth routes
    Route::match(['GET', 'POST'], '/store-login', [AuthController::class, 'login'])->name('store.login');
    Route::match(['GET', 'POST'], '/store-register', [AuthController::class, 'register'])->name('store.register');
    Route::post( '/store-logout', [AuthController::class, 'logout'])->name('store.logout');
    Route::match(['GET', 'POST'], '/store-forgot-password', [AuthController::class, 'forgotPassword'])->name('store.forgot-password');
    Route::match(['GET', 'POST'], '/store-reset-password/{token}', [AuthController::class, 'resetPassword'])->name('store.reset-password');
    
    // Profile routes
    Route::post('/customer/profile/update', [ProfileController::class, 'updateProfile'])->name('store.profile.update');
    Route::post('/customer/profile/password', [ProfileController::class, 'updatePassword'])->name('store.profile.password');

    // Order routes
    Route::post('/customer-order/place', [OrderController::class, 'placeOrder'])->name('store.order.place');
    Route::get('/customer-order/success/{orderNumber}', [ThemeController::class, 'orderConfirmation'])->name('store.order.success');
    Route::get('/stripe/success/{orderNumber}', [StripeController::class, 'success'])->name('store.stripe.success');
    Route::get('/paypal/success/{orderNumber}', [PayPalController::class, 'success'])->name('store.paypal.success');
    Route::get('/payfast/success/{orderNumber}', [PayFastController::class, 'success'])->name('store.payfast.success');
    Route::get('/mercadopago/success/{orderNumber}', [MercadoPagoController::class, 'success'])->name('store.mercadopago.success');
    Route::get('/paystack/success/{orderNumber}', [PaystackController::class, 'success'])->name('store.paystack.success');
    Route::get('/flutterwave/success/{orderNumber}', [FlutterwaveController::class, 'success'])->name('store.flutterwave.success');
    Route::get('/paytabs/success/{orderNumber}', [PayTabsController::class, 'success'])->name('store.paytabs.success');
    Route::get('/customer-cashfree/success/{orderNumber}', [CashfreeController::class, 'success'])->name('store.cashfree.success');
    Route::post('/customer-cashfree/verify-payment', [CashfreeController::class, 'verifyPayment'])->name('store.cashfree.verify-payment');
    Route::get('/coingate/success/{orderNumber}', [CoinGateController::class, 'success'])->name('store.coingate.success');
    Route::match(['GET', 'POST'], '/coingate/payment', [CoinGateController::class, 'processPayment'])->name('store.coingate.payment');
    Route::get('/tap/success/{orderNumber}', [TapController::class, 'success'])->name('store.tap.success');
    Route::match(['GET', 'POST'], '/tap/payment', [TapController::class, 'processPayment'])->name('store.tap.payment');
    Route::get('/xendit/success/{orderNumber}', [XenditController::class, 'success'])->name('store.xendit.success');
    Route::post('/xendit/callback', [XenditController::class, 'callback'])->name('store.xendit.callback');
    Route::get('/toyyibpay/success/{orderNumber}', [ToyyibPayController::class, 'success'])->name('store.toyyibpay.success');
    Route::post('/toyyibpay/callback', [ToyyibPayController::class, 'callback'])->name('store.toyyibpay.callback');
    
    // Account routes
    Route::get('/my-orders', [ThemeController::class, 'myOrders'])->name('store.my-orders');
    Route::get('/my-order/{orderNumber}', [ThemeController::class, 'orderDetail'])->name('store.order-detail');
    Route::get('/my-profile', [ThemeController::class, 'myProfile'])->name('store.my-profile');
    
    // Checkout routes
    Route::get('/checkout', [ThemeController::class, 'checkout'])->name('store.checkout');
    Route::get('/order-confirmation/{orderNumber?}', [ThemeController::class, 'orderConfirmation'])->name('store.order-confirmation');
    
    // Blog routes
    Route::get('/blog', [ThemeController::class, 'blog'])->name('store.blog');
    Route::get('/blog/post/{slug}', [ThemeController::class, 'blogPost'])->name('store.blog.show')->where('slug', '[a-z0-9\-]+');

    // store home is handled via DomainResolver for custom domains, and via storeSlug prefix for normal access
    Route::get('/', [ThemeController::class, 'home'])->name('store.home');
});
