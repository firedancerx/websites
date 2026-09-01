import { DateTime, Duration } from 'luxon';

/**
 * Alpine.js data component: guillotinaTimer
 * Counts down to SLA deadline. Color shifts green→amber→red→critical.
 * Used by guillotina-timer.blade.php component.
 */
window.guillotinaTimer = (deadlineIso) => ({
    deadline:   deadlineIso ? DateTime.fromISO(deadlineIso, { zone: 'Asia/Kuala_Lumpur' }) : null,
    display:    '--:--:--',
    colorClass: 'text-slate-400',
    isPulsing:  false,
    isExpired:  false,
    interval:   null,

    init() {
        if (!this.deadline) return;
        this.tick();
        this.interval = setInterval(() => this.tick(), 1000);
    },

    destroy() {
        if (this.interval) clearInterval(this.interval);
    },

    tick() {
        if (!this.deadline) return;

        const now       = DateTime.now().setZone('Asia/Kuala_Lumpur');
        const diffMs    = this.deadline.diff(now).toMillis();

        if (diffMs <= 0) {
            this.display    = '00:00:00';
            this.colorClass = 'text-guillotina font-bold guillotina-critical';
            this.isPulsing  = true;
            this.isExpired  = true;
            clearInterval(this.interval);
            return;
        }

        const dur  = Duration.fromMillis(diffMs).shiftTo('hours', 'minutes', 'seconds');
        const h    = String(Math.floor(dur.hours)).padStart(2, '0');
        const m    = String(Math.floor(dur.minutes)).padStart(2, '0');
        const s    = String(Math.floor(dur.seconds)).padStart(2, '0');
        this.display = `${h}:${m}:${s}`;

        const totalHours = diffMs / 3600000;

        if (totalHours <= 1) {
            this.colorClass = 'text-kojid-red font-bold';
            this.isPulsing  = true;
        } else if (totalHours <= 4) {
            this.colorClass = 'text-kojid-amber font-bold';
            this.isPulsing  = false;
        } else {
            this.colorClass = 'text-kojid-green font-medium';
            this.isPulsing  = false;
        }
    },
});

/**
 * Alpine.js data component: orderStatePoller
 * Polls the server every 30s to refresh order status for live tracking.
 */
window.orderStatePoller = (orderId, currentStatus) => ({
    status:   currentStatus,
    polling:  null,

    init() {
        // Only poll for non-terminal orders
        const terminal = ['RISK_ACQUIRED','SETTLED','ADJUSTED','CANCELLED','CANCELLED_FORFEITED'];
        if (terminal.includes(this.status)) return;

        this.polling = setInterval(() => this.poll(), 30000);
    },

    destroy() {
        if (this.polling) clearInterval(this.polling);
    },

    async poll() {
        try {
            const res = await fetch(`/api/v1/orders/${orderId}/status`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.status && data.status !== this.status) {
                // Status changed — reload the page for full state refresh
                window.location.reload();
            }
        } catch {}
    },
});
