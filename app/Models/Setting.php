<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'store_id',
        'key',
        'value',
    ];

    /**
     * Get the user that owns the setting.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the store that owns the setting.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get settings for user (global if store_id is null, store-specific if provided)
     */
    public static function getUserSettings($userId, $storeId = null)
    {
        return self::where('user_id', $userId)
                  ->where('store_id', $storeId)
                  ->pluck('value', 'key')
                  ->toArray();
    }

    /**
     * Get a specific setting value
     */
    public static function getSetting($key, $userId, $storeId = null, $default = null, $fallbackToUserGlobal = false)
    {
        $setting = self::where('user_id', $userId)
                      ->where('store_id', $storeId)
                      ->where('key', $key)
                      ->first();
        
        if ($setting) {
            return $setting->value;
        }

        if ($fallbackToUserGlobal && $storeId !== null) {
            $globalSetting = self::where('user_id', $userId)
                                ->whereNull('store_id')
                                ->where('key', $key)
                                ->first();
            
            if ($globalSetting) {
                return $globalSetting->value;
            }
        }
        
        return $default;
    }

    /**
     * Set a setting value
     */
    public static function setSetting($key, $value, $userId, $storeId = null)
    {
        return self::updateOrCreate(
            ['user_id' => $userId, 'store_id' => $storeId, 'key' => $key],
            ['value' => $value]
        );
    }
}