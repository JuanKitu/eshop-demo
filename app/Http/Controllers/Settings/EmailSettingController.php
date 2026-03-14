<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Mail\TestMail;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class EmailSettingController extends Controller
{
    /**
     * Get email settings for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmailSettings()
    {
        $user = auth()->user();
        $ownerId = $user->creatorId();
        $storeId = $user->type === 'superadmin' ? null : getCurrentStoreId($user);
        
        $settings = [
            'provider' => getSetting('email_provider', 'smtp', $ownerId, $storeId),
            'driver' => getSetting('email_driver', 'smtp', $ownerId, $storeId),
            'host' => getSetting('email_host', 'smtp.example.com', $ownerId, $storeId),
            'port' => getSetting('email_port', '587', $ownerId, $storeId),
            'username' => getSetting('email_username', 'user@example.com', $ownerId, $storeId),
            'password' => getSetting('email_password', '', $ownerId, $storeId),
            'encryption' => getSetting('email_encryption', 'tls', $ownerId, $storeId),
            'fromAddress' => getSetting('email_from_address', 'noreply@example.com', $ownerId, $storeId),
            'fromName' => getSetting('email_from_name', 'StoreGo System', $ownerId, $storeId)
        ];

        // Mask password if it exists
        if (!empty($settings['password'])) {
            $settings['password'] = '••••••••••••';
        }

        return response()->json($settings);
    }

    /**
     * Update email settings for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function updateEmailSettings(Request $request)
    {
        $user = Auth::user();
        $ownerId = $user->creatorId();
        $storeId = $user->type === 'superadmin' ? null : getCurrentStoreId($user);
        
        $validated = $request->validate([
            'provider' => 'required|string',
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'encryption' => 'required|string',
            'fromAddress' => 'required|email',
            'fromName' => 'required|string',
        ]);

        updateSetting('email_provider', $validated['provider'], $ownerId, $storeId);
        updateSetting('email_driver', $validated['driver'], $ownerId, $storeId);
        updateSetting('email_host', $validated['host'], $ownerId, $storeId);
        updateSetting('email_port', $validated['port'], $ownerId, $storeId);
        updateSetting('email_username', $validated['username'], $ownerId, $storeId);
        
        // Only update password if provided and not masked
        if (!empty($validated['password']) && $validated['password'] !== '••••••••••••') {
            updateSetting('email_password', $validated['password'], $ownerId, $storeId);
        }
        
        updateSetting('email_encryption', $validated['encryption'], $ownerId, $storeId);
        updateSetting('email_from_address', $validated['fromAddress'], $ownerId, $storeId);
        updateSetting('email_from_name', $validated['fromName'], $ownerId, $storeId);

        return redirect()->back()->with('success', __('Email settings updated successfully'));
    }

    /**
     * Send a test email.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function sendTestEmail(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'email' => 'required|email',
            ]
        );

        if ($validator->fails()) {
            return redirect()->back()->with('error', $validator->errors()->first());
        }

        $user = auth()->user();
        $ownerId = $user->creatorId();
        $storeId = $user->type === 'superadmin' ? null : getCurrentStoreId($user);
        
        $settings = [
            'provider' => getSetting('email_provider', 'smtp', $ownerId, $storeId),
            'driver' => getSetting('email_driver', 'smtp', $ownerId, $storeId),
            'host' => getSetting('email_host', 'smtp.example.com', $ownerId, $storeId),
            'port' => getSetting('email_port', '587', $ownerId, $storeId),
            'username' => getSetting('email_username', 'user@example.com', $ownerId, $storeId),
            'encryption' => getSetting('email_encryption', 'tls', $ownerId, $storeId),
            'fromAddress' => getSetting('email_from_address', 'noreply@example.com', $ownerId, $storeId),
            'fromName' => getSetting('email_from_name', 'StoreGo System', $ownerId, $storeId)
        ];
        
        // Get the actual password (not masked)
        $password = getSetting('email_password', '', $ownerId, $storeId);
        
        try {
            // Configure mail settings for this request only
            config([
                'mail.default' => $settings['driver'],
                'mail.mailers.smtp.host' => $settings['host'],
                'mail.mailers.smtp.port' => $settings['port'],
                'mail.mailers.smtp.encryption' => $settings['encryption'] === 'none' ? null : $settings['encryption'],
                'mail.mailers.smtp.username' => $settings['username'],
                'mail.mailers.smtp.password' => $password,
                'mail.from.address' => $settings['fromAddress'],
                'mail.from.name' => $settings['fromName'],
            ]);

            // Send test email
            Mail::to($request->email)->send(new TestMail());

            return redirect()->back()->with('success', __('Test email sent successfully to :email', ["email" =>  $request->email]));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to send test email: :message' , ["message" => $e->getMessage()]));
        }
    }

    /**
     * Get a setting value for a user.
     *
     * @param  int  $userId
     * @param  string  $key
     * @param  mixed  $default
     * @return mixed
     */

}