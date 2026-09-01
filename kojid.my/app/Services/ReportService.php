<?php

namespace App\Services;

use App\Models\Order;
use App\Models\LedgerEntry;
use App\Models\Deposit;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Brick\Money\Money;

/**
 * ReportService
 *
 * Generates all business reports with multi-format export (PDF, XLSX, CSV).
 * All monetary values use brick/money — never floats.
 * Timestamps converted to MYT (Asia/Kuala_Lumpur) in output.
 */
class ReportService
{
    public function __construct(
        private readonly LedgerService $ledgerService,
    ) {}

    /**
     * Executive dashboard summary data.
     *
     * @param  int $tenantId
     * @return array
     */
    public function getDashboardData(int $tenantId): array
    {
        $wc = $this->ledgerService->getWorkingCapitalPosition($tenantId);

        $activeInbound = Order::where('tenant_id', $tenantId)
                              ->where('type', 'inbound')
                              ->whereNotIn('status', Order::TERMINAL_STATES)
                              ->count();

        $activeOutbound = Order::where('tenant_id', $tenantId)
                               ->where('type', 'outbound')
                               ->whereNotIn('status', Order::TERMINAL_STATES)
                               ->count();

        $todayMargin = LedgerEntry::where('tenant_id', $tenantId)
                                  ->where('account_code', '4000')
                                  ->whereDate('posted_at', today())
                                  ->sum('cr_amount');

        $ghostOrders = Order::where('tenant_id', $tenantId)
                            ->approachingGuillotina(4)
                            ->orderBy('sla_deadline_at')
                            ->with('entity')
                            ->get();

        $recentOrders = Order::where('tenant_id', $tenantId)
                             ->latest()
                             ->limit(10)
                             ->get();

        return [
            'working_capital'  => $wc,
            'active_inbound'   => $activeInbound,
            'active_outbound'  => $activeOutbound,
            'today_margin'     => Money::of((string) $todayMargin, 'MYR'),
            'ghost_orders'     => $ghostOrders,
            'recent_orders'    => $recentOrders,
        ];
    }

    /**
     * Receivables aging report — grouped by 0-30, 31-60, 61-90, 90+ days.
     *
     * @param  int $tenantId
     * @return array<array{entity: string, amount: string, days_overdue: int, bucket: string}>
     */
    public function getReceivablesAging(int $tenantId): array
    {
        $orders = Order::where('tenant_id', $tenantId)
                       ->where('type', 'outbound')
                       ->where('status', Order::OUTBOUND_DELIVERED)
                       ->whereNull('settled_at')
                       ->with('entity')
                       ->get();

        return $orders->map(function ($order) {
            $daysOverdue = (int) now()->diffInDays($order->updated_at);
            $bucket = match (true) {
                $daysOverdue <= 30  => '0-30',
                $daysOverdue <= 60  => '31-60',
                $daysOverdue <= 90  => '61-90',
                default             => '90+',
            };

            return [
                'order_number' => $order->order_number,
                'entity'       => $order->entity->name,
                'amount'       => $order->total_amount,
                'days_overdue' => $daysOverdue,
                'bucket'       => $bucket,
            ];
        })->toArray();
    }

    /**
     * Ghost orders report — all orders approaching or past Guillotina.
     *
     * @param  int $tenantId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getGhostOrders(int $tenantId)
    {
        return Order::where('tenant_id', $tenantId)
                    ->whereNotNull('sla_deadline_at')
                    ->whereNotIn('status', Order::TERMINAL_STATES)
                    ->orderBy('sla_deadline_at')
                    ->with(['entity', 'stateLogs' => fn ($q) => $q->latest('triggered_at')->limit(1)])
                    ->get();
    }

    /**
     * Deposit aging — outstanding deposits by counterparty.
     *
     * @param  int $tenantId
     * @return array
     */
    public function getDepositAging(int $tenantId): array
    {
        return Deposit::where('tenant_id', $tenantId)
                      ->whereIn('status', ['PENDING', 'RECEIVED'])
                      ->with(['entity', 'order'])
                      ->orderBy('created_at')
                      ->get()
                      ->map(function ($deposit) {
                          return [
                              'entity'       => $deposit->entity->name,
                              'order_number' => $deposit->order->order_number,
                              'amount'       => $deposit->amount,
                              'status'       => $deposit->status,
                              'age_days'     => (int) now()->diffInDays($deposit->created_at),
                          ];
                      })->toArray();
    }

    /**
     * Export data to PDF.
     *
     * @param  string $view    Blade view name (e.g. 'reports.trial-balance')
     * @param  array  $data    Data to pass to the view
     * @param  string $filename Download filename
     */
    public function exportPdf(string $view, array $data, string $filename): Response
    {
        $pdf = Pdf::loadView($view, $data)
                  ->setPaper('a4', 'portrait');

        return $pdf->download($filename . '.pdf');
    }

    /**
     * Export data to XLSX via Maatwebsite Excel.
     *
     * @param  object $export  An export class implementing FromCollection/FromArray
     * @param  string $filename
     */
    public function exportXlsx(object $export, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        return Excel::download($export, $filename . '.xlsx');
    }
}
