<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;

class MailConfigService
{
    /**
     * Check whether email settings are properly configured.
     */
    public static function isConfigured(): bool
    {
        $host     = getSetting('email_host', '');
        $username = getSetting('email_username', '');
        $password = getSetting('email_password', '');

        // Treat default placeholder values as not configured
        $defaultHosts = ['smtp.example.com', 'smtp.mailtrap.io', '', null];

        if (in_array(trim($host), $defaultHosts, true)) {
            return false;
        }

        if (empty(trim($username)) || empty(trim($password))) {
            return false;
        }

        return true;
    }

    public static function setDynamicConfig()
    {
        // Validate before applying config — prevents crash when SMTP is unconfigured
        if (!self::isConfigured()) {
            throw new \Exception(
                'Email settings are not configured. Please set up SMTP credentials in Admin → Settings → Email Settings before enabling email verification.'
            );
        }

        $settings = [
            'driver'      => getSetting('email_driver', 'smtp'),
            'host'        => getSetting('email_host', 'smtp.example.com'),
            'port'        => getSetting('email_port', '587'),
            'username'    => getSetting('email_username', ''),
            'password'    => getSetting('email_password', ''),
            'encryption'  => getSetting('email_encryption', 'tls'),
            'fromAddress' => getSetting('email_from_address', 'noreply@example.com'),
            'fromName'    => getSetting('email_from_name', 'StoreGo System'),
        ];

        Config::set([
            'mail.default'                    => $settings['driver'],
            'mail.mailers.smtp.host'          => $settings['host'],
            'mail.mailers.smtp.port'          => $settings['port'],
            'mail.mailers.smtp.encryption'    => $settings['encryption'] === 'none' ? null : $settings['encryption'],
            'mail.mailers.smtp.username'      => $settings['username'],
            'mail.mailers.smtp.password'      => $settings['password'],
            'mail.from.address'               => $settings['fromAddress'],
            'mail.from.name'                  => $settings['fromName'],
        ]);
    }
}