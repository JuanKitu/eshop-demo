<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        try {
            $request->user()->sendEmailVerificationNotification();
            return back()->with('status', 'verification-link-sent');
        } catch (\Exception $e) {
            \Log::error('Resend email verification failed: ' . $e->getMessage());
            return back()->with('error', __('Verification email could not be sent. Please contact the administrator to configure SMTP email settings.'));
        }
    }
}
