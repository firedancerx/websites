<?php

namespace App\Http\Controllers\Quota;

use App\Http\Controllers\Controller;
use App\Models\QuotaClaim;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class QuotaClaimController extends Controller
{
    /**
     * Display a listing of claims (roster/balances).
     */
    public function index()
    {
        $user = Auth::user();
        
        // Load claims for active tenant
        $claims = QuotaClaim::orderBy('created_at', 'desc')->get();

        return view('quota.roster', compact('claims'));
    }

    /**
     * Show verification queue for Level 1 parents.
     */
    public function queue()
    {
        $user = Auth::user();
        
        // Security check: Must be a Level 1 parent tenant to view verification queue
        if (!$user->isSuperAdmin() && $user->tenant && $user->tenant->parent_id !== null) {
            abort(403, 'Akses dinafikan. Hanya parent tenant boleh mengesahkan kuota.');
        }

        $tenantId = $user->tenant_id ?? 1;
        $subtenantIds = Tenant::where('parent_id', $tenantId)->pluck('id')->toArray();

        // Query provisional claims of subtenants (using withoutTenantScope to look across subtenants)
        $claims = QuotaClaim::withoutTenantScope()
            ->whereIn('tenant_id', $subtenantIds)
            ->where('status', 'provisional')
            ->orderBy('created_at', 'asc')
            ->get();

        return view('quota.queue', compact('claims'));
    }

    /**
     * Show the form for creating a new claim.
     */
    public function create()
    {
        return view('quota.claim');
    }

    /**
     * Store a newly created claim.
     */
    public function store(Request $request)
    {
        $request->validate([
            'commodity_type' => ['required', 'string', 'in:rice,sugar,cooking_oil'],
            'claimed_qty'    => ['required', 'numeric', 'min:0.01'],
            'evidence_file'  => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $evidencePath = $request->file('evidence_file')->store('evidence', 'public');
        }

        QuotaClaim::create([
            'tenant_id'      => Auth::user()->tenant_id,
            'commodity_type' => $request->input('commodity_type'),
            'claimed_qty'    => $request->input('claimed_qty'),
            'evidence_path'  => $evidencePath,
            'status'         => 'provisional',
        ]);

        return redirect()->route('quota.index')
            ->with('success', 'Tuntutan kuota provisional telah dihantar untuk kelulusan parent tenant.');
    }

    /**
     * Verify (Approve/Reject) a provisional claim.
     */
    public function verify(Request $request, QuotaClaim $claim)
    {
        $request->validate([
            'action'         => ['required', 'string', 'in:approve,reject'],
            'reviewer_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $user = Auth::user();
        
        // Security check: Must be the parent of the claimant tenant
        $claimantTenant = Tenant::find($claim->tenant_id);
        if (!$claimantTenant || $claimantTenant->parent_id !== $user->tenant_id) {
            abort(403, 'Akses dinafikan. Anda bukan parent tenant bagi pemohon.');
        }

        $status = $request->input('action') === 'approve' ? 'confirmed' : 'rejected';

        // Update claim using a scope-bypassed query to update subtenant records
        QuotaClaim::withoutTenantScope()
            ->where('id', $claim->id)
            ->update([
                'status'         => $status,
                'reviewer_notes' => $request->input('reviewer_notes'),
                'verified_by'    => $user->id,
                'verified_at'    => now(),
            ]);

        return redirect()->route('quota.queue')
            ->with('success', 'Tuntutan kuota telah ' . ($status === 'confirmed' ? 'disahkan' : 'ditolak') . '.');
    }

    /**
     * Show quota balances.
     */
    public function balance()
    {
        $user = Auth::user();
        
        // Sum confirmed quotas
        $quotaBalances = QuotaClaim::where('status', 'confirmed')
            ->groupBy('commodity_type')
            ->selectRaw('commodity_type, SUM(claimed_qty) as total')
            ->pluck('total', 'commodity_type')
            ->toArray();

        return view('quota.balance', compact('quotaBalances'));
    }
}
