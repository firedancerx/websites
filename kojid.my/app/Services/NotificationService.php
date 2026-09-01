<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Deposit;
use App\Models\KojidNotification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * NotificationService
 *
 * Sends in-app and email notifications for all KOJID business events.
 * All notification text is bilingual (MS + EN) as stored in kojid_notifications table.
 * User locale preference determines which language is displayed in-app.
 */
class NotificationService
{
    /**
     * Notify all relevant users of an order state transition.
     *
     * @param  Order       $order
     * @param  string      $fromState
     * @param  string      $toState
     * @param  User|null   $actor
     */
    public function notifyOrderStateChange(Order $order, string $fromState, string $toState, ?User $actor): void
    {
        $type    = "order.state.{$toState}";
        $users   = $this->getOrderStakeholders($order);

        $titleMs = __('notifications.order_state_changed_title', ['number' => $order->order_number], 'ms');
        $titleEn = __('notifications.order_state_changed_title', ['number' => $order->order_number], 'en');
        $bodyMs  = __('notifications.order_state_changed_body', [
            'number' => $order->order_number, 'from' => $fromState, 'to' => $toState,
        ], 'ms');
        $bodyEn  = __('notifications.order_state_changed_body', [
            'number' => $order->order_number, 'from' => $fromState, 'to' => $toState,
        ], 'en');

        foreach ($users as $user) {
            $this->create($user, $type, $titleMs, $titleEn, $bodyMs, $bodyEn, [
                'order_id'   => $order->id,
                'action_url' => $order->type === 'inbound'
                    ? route('orders.inbound.show', $order)
                    : route('orders.outbound.show', $order),
            ]);
        }
    }

    /**
     * Send Guillotina warning notification (4h or 1h before deadline).
     *
     * @param  Order $order
     * @param  int   $hoursRemaining  4 or 1
     */
    public function sendGuillotinaWarning(Order $order, int $hoursRemaining): void
    {
        $type  = $hoursRemaining <= 1 ? 'guillotina.final_warning' : 'guillotina.warning';
        $users = $this->getOrderStakeholders($order);

        $titleMs = __('notifications.guillotina_warning_title', ['hours' => $hoursRemaining], 'ms');
        $titleEn = __('notifications.guillotina_warning_title', ['hours' => $hoursRemaining], 'en');
        $bodyMs  = __('notifications.guillotina_warning_body', [
            'number' => $order->order_number,
            'hours'  => $hoursRemaining,
            'time'   => $order->sla_deadline_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i'),
        ], 'ms');
        $bodyEn  = __('notifications.guillotina_warning_body', [
            'number' => $order->order_number,
            'hours'  => $hoursRemaining,
            'time'   => $order->sla_deadline_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i'),
        ], 'en');

        foreach ($users as $user) {
            $this->create($user, $type, $titleMs, $titleEn, $bodyMs, $bodyEn, [
                'order_id'   => $order->id,
                'action_url' => route('orders.inbound.show', $order),
                'urgency'    => $hoursRemaining <= 1 ? 'critical' : 'warning',
            ]);
        }
    }

    /**
     * Notify that Guillotina has fired on an order.
     */
    public function notifyGuillotinaFired(Order $order): void
    {
        $users = $this->getOrderStakeholders($order);

        foreach ($users as $user) {
            $this->create(
                $user,
                'guillotina.triggered',
                __('notifications.guillotina_fired_title', ['number' => $order->order_number], 'ms'),
                __('notifications.guillotina_fired_title', ['number' => $order->order_number], 'en'),
                __('notifications.guillotina_fired_body', ['number' => $order->order_number], 'ms'),
                __('notifications.guillotina_fired_body', ['number' => $order->order_number], 'en'),
                ['order_id' => $order->id],
            );
        }
    }

    /**
     * Notify that a deposit has been received.
     */
    public function notifyDepositReceived(Deposit $deposit): void
    {
        $order = $deposit->order;
        $users = $this->getOrderStakeholders($order);

        foreach ($users as $user) {
            $this->create(
                $user,
                'deposit.received',
                __('notifications.deposit_received_title', [], 'ms'),
                __('notifications.deposit_received_title', [], 'en'),
                __('notifications.deposit_received_body', [
                    'order'  => $order->order_number,
                    'amount' => number_format($deposit->amount, 2),
                ], 'ms'),
                __('notifications.deposit_received_body', [
                    'order'  => $order->order_number,
                    'amount' => number_format($deposit->amount, 2),
                ], 'en'),
                ['order_id' => $order->id, 'deposit_id' => $deposit->id],
            );
        }
    }

    /**
     * Notify that settlement has been completed.
     */
    public function notifySettlementCompleted(Order $order): void
    {
        $users = $this->getOrderStakeholders($order);

        foreach ($users as $user) {
            $this->create(
                $user,
                'settlement.completed',
                __('notifications.settlement_completed_title', [], 'ms'),
                __('notifications.settlement_completed_title', [], 'en'),
                __('notifications.settlement_completed_body', ['order' => $order->order_number], 'ms'),
                __('notifications.settlement_completed_body', ['order' => $order->order_number], 'en'),
                ['order_id' => $order->id],
            );
        }
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllRead(User $user): int
    {
        return KojidNotification::where('user_id', $user->id)
                                ->whereNull('read_at')
                                ->update(['read_at' => now()]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Create a notification record and optionally queue an email.
     *
     * @param  User   $user
     * @param  string $type
     * @param  string $titleMs
     * @param  string $titleEn
     * @param  string $bodyMs
     * @param  string $bodyEn
     * @param  array  $meta     ['order_id', 'deposit_id', 'action_url', etc.]
     */
    private function create(
        User $user,
        string $type,
        string $titleMs,
        string $titleEn,
        string $bodyMs,
        string $bodyEn,
        array $meta = [],
    ): void {
        try {
            KojidNotification::create([
                'tenant_id'  => $user->tenant_id,
                'user_id'    => $user->id,
                'type'       => $type,
                'title_ms'   => $titleMs,
                'title_en'   => $titleEn,
                'body_ms'    => $bodyMs,
                'body_en'    => $bodyEn,
                'order_id'   => $meta['order_id'] ?? null,
                'deposit_id' => $meta['deposit_id'] ?? null,
                'action_url' => $meta['action_url'] ?? null,
                'metadata'   => $meta,
                'sent_via'   => 'both',
            ]);

            // Queue email notification via SendOrderNotification job
            dispatch(new \App\Jobs\SendOrderNotification(
                $user, $type,
                $user->locale === 'ms' ? $titleMs : $titleEn,
                $user->locale === 'ms' ? $bodyMs  : $bodyEn,
                $meta['action_url'] ?? null,
            ))->onQueue('notifications');

        } catch (\Throwable $e) {
            Log::error('NotificationService::create failed', [
                'user_id' => $user->id,
                'type'    => $type,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get all users who should receive notifications for an order.
     * Returns tenant users with relevant roles for the order type.
     *
     * @return \Illuminate\Support\Collection<User>
     */
    private function getOrderStakeholders(Order $order): \Illuminate\Support\Collection
    {
        $roles = $order->type === 'inbound'
            ? ['tenant_admin', 'procurement_officer', 'finance_officer', 'warehouse_staff']
            : ['tenant_admin', 'sales_officer', 'finance_officer'];

        return User::where('tenant_id', $order->tenant_id)
                   ->where('is_active', true)
                   ->whereHas('roles', fn ($q) => $q->whereIn('name', $roles))
                   ->get();
    }
}
