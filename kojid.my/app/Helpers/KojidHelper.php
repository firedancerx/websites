<?php

namespace App\Helpers;

class KojidHelper
{
    /**
     * Format currency amount based on currency symbol.
     *
     * @param float|decimal $amount
     * @param string $currency
     * @return string
     */
    public static function formatCurrency($amount, string $currency = 'MYR'): string
    {
        $formatted = number_format($amount, 2);
        
        switch (strtoupper($currency)) {
            case 'MYR':
                return 'RM ' . $formatted;
            case 'SGD':
                return 'S$ ' . $formatted;
            case 'USD':
                return '$ ' . $formatted;
            case 'EUR':
                return '€ ' . $formatted;
            default:
                return $currency . ' ' . $formatted;
        }
    }
}
