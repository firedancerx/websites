<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Entities Report</title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 9px; line-height: 1.35; }
        h1 { margin: 0 0 4px; font-size: 20px; color: #0f172a; }
        .meta { margin-bottom: 16px; color: #64748b; }
        .summary { margin-bottom: 14px; padding: 8px 10px; background: #f1f5f9; border-left: 3px solid #16a34a; }
        .entity { margin-bottom: 14px; border: 1px solid #cbd5e1; page-break-inside: avoid; }
        .entity-title { padding: 8px 10px; background: #0f172a; color: #fff; font-size: 12px; font-weight: bold; }
        .entity-title span { float: right; color: #cbd5e1; font-size: 9px; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        th { width: 31%; text-align: left; background: #f8fafc; color: #475569; font-weight: bold; }
        td { overflow-wrap: anywhere; }
        tr:last-child th, tr:last-child td { border-bottom: 0; }
        .empty { padding: 24px; text-align: center; color: #64748b; border: 1px solid #cbd5e1; }
        .footer { position: fixed; bottom: -12px; left: 0; right: 0; text-align: center; color: #94a3b8; font-size: 8px; }
    </style>
</head>
<body>
    <h1>Entities Report</h1>
    <div class="meta">Generated {{ $generatedAt->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, H:i') }}</div>
    <div class="summary">Total entities: <strong>{{ $entities->count() }}</strong></div>

    @forelse($entities as $entity)
        <section class="entity">
            <div class="entity-title">
                {{ $entity->name }}
                <span>ID {{ $entity->id }}</span>
            </div>
            <table>
                <tbody>
                    <tr><th>Tenant</th><td>{{ $entity->tenant?->name ?? '—' }} (ID {{ $entity->tenant_id }})</td></tr>
                    <tr><th>Active roles</th><td>{{ $entity->activeRoles->pluck('role')->join(', ') ?: '—' }}</td></tr>
                    @foreach($entity->getAttributes() as $attribute => $value)
                        @php
                            if ($value === null || $value === '') {
                                $displayValue = '—';
                            } elseif ($attribute === 'is_blacklisted') {
                                $displayValue = $value ? 'Yes' : 'No';
                            } elseif ($attribute === 'kyc_documents') {
                                $decoded = json_decode($value, true);
                                $displayValue = is_array($decoded) ? implode(', ', $decoded) : $value;
                            } else {
                                $displayValue = $value;
                            }
                        @endphp
                        <tr>
                            <th>{{ ucwords(str_replace('_', ' ', $attribute)) }}</th>
                            <td>{{ $displayValue }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>
    @empty
        <div class="empty">No entities match the current filters.</div>
    @endforelse

    <div class="footer">KOJID · Confidential entity report</div>
</body>
</html>
