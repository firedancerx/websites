import Alpine from 'alpinejs';
import axios   from 'axios';

// ── Axios defaults ────────────────────────────────────────────────────────────
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const csrfMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfMeta) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfMeta.getAttribute('content');
}

// ── Alpine global helpers ─────────────────────────────────────────────────────
window.Alpine = Alpine;

// Sidebar toggle store
Alpine.store('sidebar', {
    open: window.innerWidth >= 1024,
    toggle() { this.open = !this.open; },
    close()  { this.open = false; },
});

// Flash message auto-dismiss
Alpine.data('flash', () => ({
    show: true,
    init() {
        if (this.show) {
            setTimeout(() => { this.show = false; }, 5000);
        }
    },
}));

// Confirm dialog helper (wraps SweetAlert2)
window.kojidConfirm = async (message, confirmText = 'Teruskan', type = 'warning') => {
    const { default: Swal } = await import('sweetalert2');
    const result = await Swal.fire({
        title:              message,
        icon:               type,
        showCancelButton:   true,
        confirmButtonText:  confirmText,
        cancelButtonText:   'Batal',
        confirmButtonColor: type === 'danger' ? '#dc2626' : '#16a34a',
        reverseButtons:     true,
        customClass: {
            popup:         'rounded-xl shadow-2xl',
            confirmButton: 'btn btn-primary',
            cancelButton:  'btn btn-secondary',
        },
    });
    return result.isConfirmed;
};

// Format MYR currency
window.formatMYR = (amount) => {
    return 'RM ' + parseFloat(amount).toLocaleString('ms-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// Notification badge polling — refreshes every 60s
Alpine.data('notificationBadge', () => ({
    count: 0,
    async init() {
        await this.fetch();
        setInterval(() => this.fetch(), 60000);
    },
    async fetch() {
        try {
            const res = await axios.get('/notifications/unread-count');
            this.count = res.data.count ?? 0;
        } catch {}
    },
}));

Alpine.start();
