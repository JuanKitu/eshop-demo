<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Store;
use Inertia\Inertia;

class DomainResolver
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip during installation and admin routes
        if ($request->is('install/*') || $request->is('update/*') || !file_exists(storage_path('installed'))) {
            return $next($request);
        }
        
        // Skip for admin/dashboard routes and regular store routes
        if ($request->is('dashboard*') || $request->is('admin*') || $request->is('password*') || $request->is('store/*') || $request->is('stores/*')) {
            return $next($request);
        }
        
        $host = $request->getHost();
        $store = null;
        
        // Check for custom domain first (remove protocol if present)
        $cleanHost = str_replace(['http://', 'https://'], '', $host);
        $cleanHost = rtrim($cleanHost, '/');
        
        // CRITICAL: Prevent main app domain from being used as custom domain
        $mainAppDomain = str_replace(['http://', 'https://'], '', config('app.url'));
        $mainAppDomain = rtrim($mainAppDomain, '/');
        
        // Also check without www for main domain
        $mainAppDomainWithoutWww = str_starts_with($mainAppDomain, 'www.') ? substr($mainAppDomain, 4) : $mainAppDomain;
        $mainAppDomainWithWww = 'www.' . $mainAppDomainWithoutWww;
        
        // If current host matches main app domain, skip domain resolution
        if ($cleanHost === $mainAppDomain || 
            $cleanHost === $mainAppDomainWithoutWww || 
            $cleanHost === $mainAppDomainWithWww) {
            return $next($request);
        }
        
        $store = Store::where('custom_domain', $cleanHost)
                    ->where('enable_custom_domain', true)
                    ->first();
        
        // Also check without www prefix
        if (!$store && str_starts_with($cleanHost, 'www.')) {
            $withoutWww = substr($cleanHost, 4);
            $store = Store::where('custom_domain', $withoutWww)
                        ->where('enable_custom_domain', true)
                        ->first();
        }
        // Check store status via configuration
        if ($store) {
            $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
            if (!($config['store_status'] ?? true)) {
                $store = null;
            }
        }
        
        // Check for custom subdomain if no custom domain found
        if (!$store && str_contains($cleanHost, '.')) {
            $store = Store::where('custom_subdomain', $cleanHost)
                        ->where('enable_custom_subdomain', true)
                        ->first();

            // Check store status via configuration
            if ($store) {
                $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
                if (!($config['store_status'] ?? true)) {
                    $store = null;
                }
            }
        }
        
        if ($store) {
            // Set store context for the request
            $request->attributes->set('resolved_store', $store);
            $request->attributes->set('store_theme', $store->theme);
            
            // For API requests, add store_id to request
            if ($request->is('api/*')) {
                $request->merge(['store_id' => $store->id]);
                return $next($request);
            }
            
            // Handle direct domain/subdomain access - show store directly
            if (!$request->is('store/*')) {
                // Check if store is active and not in maintenance
                $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
                
                if (!($config['store_status'] ?? true)) {
                    return Inertia::render('store/StoreDisabled', [
                        'store' => $store->only(['id', 'name', 'slug'])
                    ])->toResponse($request)->setStatusCode(503);
                }
                
                if ($config['maintenance_mode'] ?? false) {
                    return Inertia::render('store/StoreMaintenance', [
                        'store' => $store->only(['id', 'name', 'slug'])
                    ])->toResponse($request)->setStatusCode(503);
                }
                
                // Route the request to appropriate store controller method
                return $this->handleStoreRequest($request, $store);
            }
        }
        
        return $next($request);
    }
    
    /**
     * Handle store request based on path
     */
    private function handleStoreRequest(Request $request, Store $store)
    {
        $path = trim($request->getPathInfo(), '/');
        $segments = explode('/', $path);
        
        // If the first segment is the store slug, strip it (robustness layer)
        if (!empty($segments) && $segments[0] === $store->slug) {
            array_shift($segments);
            // Reconstruct path for further logic if needed, though we check segments mostly
            $path = implode('/', $segments);
        }

        // Set the store slug in route parameters
        if ($request->route()) {
            $request->route()->setParameter('storeSlug', $store->slug);
        }

        // Manually trigger Inertia sharing to ensure global props are available 
        // since this middleware returns before HandleInertiaRequests executes.
        $this->shareInertiaData($request);
        
        // Handle different store routes
        if (empty($path) || $path === '/') {
            // Home page
            return app(\App\Http\Controllers\ThemeController::class)->home($request);
        } elseif ($segments[0] === 'products' || $segments[0] === 'product-list') {
            if (isset($segments[1]) && $segments[1] === 'product' && isset($segments[2]) && is_numeric($segments[2])) {
                // Product detail page (/products/product/123 -> /product/123)
                $request->route()->setParameter('id', $segments[2]);
                return app(\App\Http\Controllers\ThemeController::class)->product($request);
            } elseif (isset($segments[1]) && is_numeric($segments[1])) {
                // Product detail page (/products/123)
                $request->route()->setParameter('id', $segments[1]);
                return app(\App\Http\Controllers\ThemeController::class)->product($request);
            } else {
                // Products listing
                return app(\App\Http\Controllers\ThemeController::class)->products($request);
            }
        } elseif ($segments[0] === 'product' && isset($segments[1]) && is_numeric($segments[1])) {  
            // Product detail page (/product/123)
            $request->route()->setParameter('id', $segments[1]);
            return app(\App\Http\Controllers\ThemeController::class)->product($request);
        } elseif ($segments[0] === 'category' && isset($segments[1])) {
            // Category page
            $request->route()->setParameter('slug', $segments[1]);
            return app(\App\Http\Controllers\ThemeController::class)->category($request);
        } elseif ($segments[0] === 'cart') {
            // Cart page
            return app(\App\Http\Controllers\ThemeController::class)->cart($request);
        } elseif ($segments[0] === 'wishlist') {
            // Wishlist page
            return app(\App\Http\Controllers\ThemeController::class)->wishlist($request);
        } elseif ($segments[0] === 'checkout') {
            // Checkout page
            return app(\App\Http\Controllers\ThemeController::class)->checkout($request);
        } elseif ($segments[0] === 'blog') {
            if (isset($segments[2]) && $segments[1] === 'post') {
                // Product detail page (/products/123)
                $request->route()->setParameter('slug', $segments[2]);
                // Blog post detail
                return app(\App\Http\Controllers\ThemeController::class)->blogPost($request);
            } else {
                // Blog listing
                return app(\App\Http\Controllers\ThemeController::class)->blog($request);
            }
        } elseif ($segments[0] === 'page' && isset($segments[1])) {
            // Custom page
            $request->route()->setParameter('slug', $segments[1]);
            return app(\App\Http\Controllers\ThemeController::class)->customPage($request);
        } elseif ($segments[0] === 'store-login') {
            // Login page - fix parameter order
            return app(\App\Http\Controllers\Store\AuthController::class)->login($request);
        } elseif ($segments[0] === 'store-register') {
            // Register page - fix parameter order
            return app(\App\Http\Controllers\Store\AuthController::class)->register($request);
        } elseif (in_array($segments[0], ['customer-logout', 'store-logout']) && $request->isMethod('POST')) {  
        // Logout
            return app(\App\Http\Controllers\Store\AuthController::class)->logout($request);
        } elseif ($segments[0] === 'store-forgot-password') {
            // Forgot password page
            return app(\App\Http\Controllers\Store\AuthController::class)->forgotPassword($request);
        } elseif ($segments[0] === 'store-reset-password' && isset($segments[1])) {
            // Reset password page
            return app(\App\Http\Controllers\Store\AuthController::class)->resetPassword($request);
        } elseif ($segments[0] === 'my-orders') {
            // My orders page
            return app(\App\Http\Controllers\ThemeController::class)->myOrders($request);
        } elseif ($segments[0] === 'my-profile') {
            // My profile page
            return app(\App\Http\Controllers\ThemeController::class)->myProfile($request);
        } elseif (in_array($segments[0], ['customer-order', 'order', 'my-order']) && isset($segments[1])) {
            if ($segments[1] === 'place' && $request->isMethod('POST')) {
                // Handle order placement POST request
                return app(\App\Http\Controllers\Store\OrderController::class)->placeOrder($request);
            } elseif ($segments[1] === 'success' && isset($segments[2])) {
                // Order success page
                if ($request->route()) {
                    $request->route()->setParameter('orderNumber', $segments[2]);
                }
                return app(\App\Http\Controllers\ThemeController::class)->orderConfirmation($request);
            } else {
                if (isset($segments[1])) {
                    $request->route()->setParameter('orderNumber', $segments[1]);
                }
                // Order detail page
                return app(\App\Http\Controllers\ThemeController::class)->orderDetail($request);
            }
        } elseif ($segments[0] === 'order-confirmation') {
            // Order confirmation page
            $orderNumber = $segments[1] ?? null;
            if ($request->route() && $orderNumber) {
                $request->route()->setParameter('orderNumber', $orderNumber);
            }
            return app(\App\Http\Controllers\ThemeController::class)->orderConfirmation($request);
        } elseif ($segments[0] === 'customer' && isset($segments[1]) && $segments[1] === 'profile' && isset($segments[2])) {
            if ($segments[2] === 'update' && $request->isMethod('POST')) {
                // Profile update
                return app(\App\Http\Controllers\Store\ProfileController::class)->updateProfile($request);
            } elseif ($segments[2] === 'password' && $request->isMethod('POST')) {
                // Password update
                return app(\App\Http\Controllers\Store\ProfileController::class)->updatePassword($request);
            }
        } elseif (in_array($segments[0], ['stripe', 'paypal', 'payfast', 'mercadopago', 'paystack', 'flutterwave', 'paytabs', 'cashfree', 'coingate', 'tap', 'xendit', 'toyyibpay']) && isset($segments[1]) && $segments[1] === 'success' && isset($segments[2])) {
            // Payment success pages
            $controllerMap = [
                'stripe' => \App\Http\Controllers\Store\StripeController::class,
                'paypal' => \App\Http\Controllers\Store\PayPalController::class,
                'payfast' => \App\Http\Controllers\Store\PayFastController::class,
                'mercadopago' => \App\Http\Controllers\Store\MercadoPagoController::class,
                'paystack' => \App\Http\Controllers\Store\PaystackController::class,
                'flutterwave' => \App\Http\Controllers\Store\FlutterwaveController::class,
                'paytabs' => \App\Http\Controllers\Store\PayTabsController::class,
                'cashfree' => \App\Http\Controllers\Store\CashfreeController::class,
                'coingate' => \App\Http\Controllers\Store\CoinGateController::class,
                'tap' => \App\Http\Controllers\Store\TapController::class,
                'xendit' => \App\Http\Controllers\Store\XenditController::class,
                'toyyibpay' => \App\Http\Controllers\Store\ToyyibPayController::class,
            ];
            
            if (isset($controllerMap[$segments[0]])) {
                if (isset($segments[2])) {
                    $request->route()->setParameter('orderNumber', $segments[2]);
                }
                return app($controllerMap[$segments[0]])->success($request);
            }
        } elseif ($segments[0] === 'customer-cashfree' && isset($segments[1]) && $segments[1] === 'verify-payment' && $request->isMethod('POST')) {
            // Cashfree payment verification
            return app(\App\Http\Controllers\Store\CashfreeController::class)->verifyPayment($request);
        } elseif ($segments[0] === 'razorpay' && isset($segments[1]) && $segments[1] === 'verify-payment' && $request->isMethod('POST')) {
            // Razorpay payment verification
            return app(\App\Http\Controllers\Store\RazorpayController::class)->verifyPayment($request);
        } elseif ($segments[0] === 'razorpay' && isset($segments[1]) && $segments[1] === 'webhook' && $request->isMethod('POST')) {
            // Razorpay webhook
            return app(\App\Http\Controllers\Store\RazorpayController::class)->webhook($request);
        } elseif (in_array($segments[0], ['mercadopago', 'payfast', 'paytabs', 'coingate', 'tap', 'xendit', 'toyyibpay']) && isset($segments[1]) && $segments[1] === 'callback' && $request->isMethod('POST')) {
            // Payment callbacks
            $callbackMap = [
                'mercadopago' => \App\Http\Controllers\Store\MercadoPagoController::class,
                'payfast' => \App\Http\Controllers\Store\PayFastController::class,
                'paytabs' => \App\Http\Controllers\Store\PayTabsController::class,
                'coingate' => \App\Http\Controllers\Store\CoinGateController::class,
                'tap' => \App\Http\Controllers\Store\TapController::class,
                'xendit' => \App\Http\Controllers\Store\XenditController::class,
                'toyyibpay' => \App\Http\Controllers\Store\ToyyibPayController::class,
            ];
            return app($callbackMap[$segments[0]])->callback($request);
        } elseif ($segments[0] === 'cashfree' && isset($segments[1]) && $segments[1] === 'webhook' && $request->isMethod('POST')) {
            // Cashfree webhook
            return app(\App\Http\Controllers\Store\CashfreeController::class)->webhook($request);
        } elseif (($segments[0] === 'coingate' || $segments[0] === 'tap') && isset($segments[1]) && $segments[1] === 'payment') {
            // Payment processing
            if ($segments[0] === 'coingate') {
                return app(\App\Http\Controllers\Store\CoinGateController::class)->processPayment($request);
            } else {
                return app(\App\Http\Controllers\Store\TapController::class)->processPayment($request);
            }
        } else {
            // Try to find a custom page with this slug
            $pageSlug = filter_var($segments[0], FILTER_SANITIZE_STRING);
            if ($pageSlug && preg_match('/^[a-zA-Z0-9-_]+$/', $pageSlug)) {
                $customPage = \App\Models\CustomPage::where('store_id', $store->id)
                    ->where('slug', $pageSlug)
                    ->where('status', 'published')
                    ->first();
            } else {
                $customPage = null;
            }
                
            if ($customPage) {
                return app(\App\Http\Controllers\ThemeController::class)->customPage($request);
            }
            // Default to home page for unknown routes
            return app(\App\Http\Controllers\ThemeController::class)->home($request);
        }
    }

    /**
     * Manually share data with Inertia
     */
    private function shareInertiaData(Request $request)
    {
        $inertiaMiddleware = new \App\Http\Middleware\HandleInertiaRequests();
        $sharedData = $inertiaMiddleware->share($request);
        
        foreach ($sharedData as $key => $value) {
            Inertia::share($key, $value);
        }
    }
}