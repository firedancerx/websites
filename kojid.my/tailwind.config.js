import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
    ],
    theme: {
        extend: {
            colors: {
                'kojid-green': {
                    DEFAULT: '#16a34a',
                    50:  '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                'kojid-amber': {
                    DEFAULT: '#d97706',
                    light:   '#fbbf24',
                    dark:    '#b45309',
                },
                'kojid-red': {
                    DEFAULT: '#dc2626',
                    dark:    '#b91c1c',
                },
                'kojid-slate': {
                    DEFAULT: '#1e293b',
                    light:   '#334155',
                },
                'guillotina': '#7f1d1d',
            },
            fontFamily: {
                'sans': ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
                'mono': ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in':    'fadeIn 0.3s ease-in',
                'slide-in':   'slideIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%':   { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)',      opacity: '1' },
                },
            },
            boxShadow: {
                'kojid': '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)',
                'card':  '0 1px 3px 0 rgba(0,0,0,0.2), 0 1px 2px 0 rgba(0,0,0,0.12)',
            },
        },
    },
    plugins: [forms, typography],
};
