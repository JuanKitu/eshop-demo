<?php
namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Currency;
use App\Models\ReferralSetting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        
        // Resolve store if on a store route but not resolved by domain middleware
        if (!$request->attributes->has('resolved_store') && $request->route('storeSlug')) {
            $storeSlug = $request->route('storeSlug');
            $store = \App\Models\Store::where('slug', $storeSlug)->first();
            if ($store) {
                $request->attributes->set('slug_store', $store);
                $request->attributes->set('store_theme', $store->theme);
            }
        }

        // Skip database queries during installation
        if ($request->is('install/*') || $request->is('update/*') || !file_exists(storage_path('installed'))) {
            $globalSettings = [
                'currencySymbol' => '$',
                'currencyNname' => 'US Dollar',
                'base_url' => config('app.url')
            ];
            $storeCurrency = [
                'code' => 'USD',
                'symbol' => '$',
                'name' => 'US Dollar',
                'position' => 'before',
                'decimals' => 2,
                'decimal_separator' => '.',
                'thousands_separator' => ','
            ];
        } else {
            // Determine context user ID: Force superadmin for public SaaS pages
            // (No store resolved AND route does not have 'auth' middleware)
            $contextUserId = null;
            if (!$request->attributes->has('resolved_store')) {
                $route = $request->route();
                $isAuthRoute = $route && in_array('auth', $route->gatherMiddleware());
                
                if (!$isAuthRoute) {
                    $superAdmin = \App\Models\User::where('type', 'superadmin')->first();
                    $contextUserId = $superAdmin ? $superAdmin->id : null;
                }
            }

            // Get system settings with context
            if (is_null($contextUserId) && auth()->check()) {
                $user = auth()->user();
                $settings = settings($user->creatorId(), getCurrentStoreId($user));
            } else {
                $settings = settings($contextUserId);
            }
            // Get currency symbol
            $currencyCode = $settings['defaultCurrency'] ?? 'USD';
            $currency = Currency::where('code', $currencyCode)->first();
            $currencySettings = [];
            if ($currency) {
                $currencySettings = [
                    'currencySymbol' => $currency->symbol, 
                    'currencyNname' => $currency->name
                ];
            } else {
                $currencySettings = [
                    'currencySymbol' =>  '$', 
                    'currencyNname' =>'US Dollar'
                ];
            }
            
            // Merge currency settings with other settings
            $globalSettings = array_merge($settings, $currencySettings);
            $globalSettings['base_url'] = config('app.url');
            $globalSettings['image_url'] = config('app.url');
            
            // Filter out sensitive keys before sharing with frontend
            $globalSettings = $this->filterSensitiveSettings($globalSettings);
            
            // Get store-specific currency settings for authenticated users
            $storeCurrency = $this->getStoreCurrencySettings($request);
        }
        
        return [
            ...parent::share($request),
            'name'  => config('app.name'),
            'base_url'  => config('app.url'),
            'image_url'  => config('app.url'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'csrf_token' => csrf_token(),
            'auth'  => function() use ($request) {
                $user = $request->user() ? $request->user()->load('stores', 'plan') : null;
                
                // Get stores for the current user
                $stores = [];
                if ($user) {
                    if ($user->type === 'company') {
                        // Company users have their own stores
                        $stores = $user->stores;
                    } elseif ($user->type === 'user' && $user->created_by) {
                        // Regular users access their creator's stores
                        $creator = \App\Models\User::find($user->created_by);
                        if ($creator) {
                            $stores = $creator->stores;
                        }
                    }
                }
                
                // Check if demo mode is enabled and there's a demo store cookie
                if ($user && config('app.is_demo') && $request->cookie('demo_store_id')) {
                    $storeId = (int) $request->cookie('demo_store_id');
                    
                    // Verify the store belongs to the user or their creator
                    $storeExists = false;
                    if ($user->type === 'company') {
                        $storeExists = $user->stores->contains('id', $storeId);
                    } elseif ($user->type === 'user' && $user->created_by) {
                        $creator = \App\Models\User::find($user->created_by);
                        if ($creator) {
                            $storeExists = $creator->stores->contains('id', $storeId);
                        }
                    }
                    
                    if ($storeExists) {
                        // Override the current_store with the one from the cookie
                        $user->current_store = $storeId;
                    }
                }

                if ($user && !in_array($user->type, ['company', 'superadmin']) ) {
                    $user->plan = $user->creator->plan;
                }
                
                // Get enabled addons (always fresh data)
                $enabledAddons = [];
                
                // In demo mode, check session for temporary language preference
                if (config('app.is_demo', false) && session('demo_language')) {
                    $locale = session('demo_language');
                } else {
                    $locale = $user->lang ?? $this->getSuperAdminLang();
                }
                return [
                    'user'        => $user,
                    'roles'       => $request->user()?->roles->pluck('name'),
                    'permissions' => $request->user()?->getAllPermissions()->pluck('name'),
                    'enabledAddons' => $enabledAddons,
                    'lang' => $locale,
                    'stores' => $stores
                ];
            },
            'isImpersonating' => session('impersonated_by') ? true : false,
            'ziggy' => fn(): array=> [
                 ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info'    => $request->session()->get('info'),
            ],
            'globalSettings' => $globalSettings,
            'superadminSettings' => !$request->is('install/*') && !$request->is('update/*') && file_exists(storage_path('installed')) ? array_merge(defaultSettings(), getSuperadminSettings()) : defaultSettings(),
            'storeCurrency' => $storeCurrency,
            'dynamicTitleText' => function() use ($request) {
                if ($request->is('install/*') || $request->is('update/*') || !file_exists(storage_path('installed'))) {
                    return config('app.name', 'StoreGo');
                }
                
                $defaultTitle = config('app.name', 'StoreGo');
                if ($request->attributes->has('resolved_store')) {
                    // Custom domain / subdomain access — set by DomainResolver
                    $defaultTitle = $request->attributes->get('resolved_store')->name;
                } elseif ($request->attributes->has('slug_store')) {
                    // Normal slug-based access — set above in this middleware
                    $defaultTitle = $request->attributes->get('slug_store')->name;
                }
                
                // Force superadmin context for public SaaS routes title
                $contextUserId = null;
                if (!$request->attributes->has('resolved_store') && !$request->attributes->has('slug_store')) {
                    $route = $request->route();
                    $isAuthRoute = $route && in_array('auth', $route->gatherMiddleware());
                    
                    if (!$isAuthRoute) {
                        $superAdmin = \App\Models\User::where('type', 'superadmin')->first();
                        $contextUserId = $superAdmin ? $superAdmin->id : null;
                    }
                }
                
                return getSetting('titleText', $defaultTitle, $contextUserId);
            },
            'referralSettings' => [
                'is_enabled' => !$request->is('install/*') && !$request->is('update/*') && file_exists(storage_path('installed')) ? ReferralSetting::isEnabled() : false,
            ],
            'is_demo' => config('app.is_demo', false),
            'stores' => function() use ($request) {
                $user = $request->user();
                if (!$user) return [];
                
                $stores = [];
                if ($user->type === 'company') {
                    $stores = $user->stores;
                } elseif ($user->type === 'user' && $user->created_by) {
                    $creator = \App\Models\User::find($user->created_by);
                    $stores = $creator ? $creator->stores : [];
                }
                
                // In demo mode, ensure current_store reflects the cookie value
                if (config('app.is_demo') && $request->cookie('demo_store_id')) {
                    $storeId = (int) $request->cookie('demo_store_id');
                    $storeExists = collect($stores)->contains('id', $storeId);
                    if ($storeExists && $user) {
                        $user->current_store = $storeId;
                    }
                }
                
                return $stores;
            }
        ];
    }
    
    /**
     * Filter out sensitive configuration keys that should not be shared with frontend
     *
     * @param array $settings
     * @return array
     */
    private function filterSensitiveSettings(array $settings): array
    {
        $sensitiveKeys = config('sensitive-keys');
        
        return array_diff_key($settings, array_flip($sensitiveKeys));
    }

    /**
     * Get superadmin language if user lang is not set
     */
    private function getSuperAdminLang(): string
    {
        $superAdmin = \App\Models\User::whereHas('roles', function($query) {
            $query->whereIn('name', ['superadmin', 'super admin']);
        })->first();
        
        return $superAdmin ? $superAdmin->lang ?? 'en' : 'en';
    }
    
    /**
     * Get currency settings from company settings for the current user
     */
    private function getStoreCurrencySettings(Request $request): array
    {
        $user = $request->user();
        
        // Default currency settings
        $defaultCurrency = [
            'code' => 'USD',
            'symbol' => '$',
            'name' => 'US Dollar',
            'position' => 'before',
            'decimals' => 2,
            'decimal_separator' => '.',
            'thousands_separator' => ','
        ];
        
        // Return default if no user
        if (!$user) {
            return $defaultCurrency;
        }
        
        try {
            // Get company/global currency settings
            $companySettings = settings($user->creatorId(), getCurrentStoreId($user));
            
            // Get currency code from company settings
            $currencyCode = $companySettings['defaultCurrency'] ?? 'USD';
            
            // Get currency details from currencies table
            $currency = Currency::where('code', $currencyCode)->first();
            
            if ($currency) {
                return [
                    'code' => $currency->code,
                    'symbol' => $currency->symbol,
                    'name' => $currency->name,
                    'position' => $companySettings['currencySymbolPosition'] ?? 'before',
                    'decimals' => (int)($companySettings['decimalFormat'] ?? 2),
                    'decimal_separator' => $companySettings['decimalSeparator'] ?? '.',
                    'thousands_separator' => $companySettings['thousandsSeparator'] ?? ','
                ];
            }
            
            return $defaultCurrency;
        } catch (\Exception $e) {
            // Return default currency if any error occurs
            return $defaultCurrency;
        }
    }
}