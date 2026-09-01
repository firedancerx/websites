{{-- resources/views/entities/index.blade.php --}}
@extends('layouts.app')
@section('title', __('entities.entities'))

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('entities.entities') }}</h1>
            <p class="page-subtitle">{{ __('entities.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
            <a href="{{ route('entities.pdf', request()->only(['search', 'type'])) }}" class="btn-secondary">
                <x-icon name="document-arrow-down" class="w-4 h-4"/> Download PDF
            </a>
            @if($canCreateEntity)
            <a href="{{ route('entities.create') }}" class="btn-primary">
                <x-icon name="plus" class="w-4 h-4"/>{{ __('entities.register') }}
            </a>
            @endif
        </div>
    </div>

    <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
            <label class="form-label">{{ __('app.search') }}</label>
            <input type="text" name="search" value="{{ request('search') }}" class="form-input w-56"
                   placeholder="{{ __('entities.search_placeholder') }}">
        </div>
        <div>
            <label class="form-label">{{ __('entities.type') }}</label>
            <select name="type" class="form-select">
                <option value="">{{ __('app.all') }}</option>
                @foreach(['supplier','buyer','quota_holder','intermediary'] as $t)
                    <option value="{{ $t }}" {{ request('type') === $t ? 'selected' : '' }}>{{ ucfirst($t) }}</option>
                @endforeach
            </select>
        </div>
        <button type="submit" class="btn-secondary"><x-icon name="arrow-path" class="w-4 h-4"/> {{ __('app.filter') }}</button>
    </form>

    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('entities.name') }}</th>
                        <th>{{ __('entities.ssm') }}</th>
                        <th>{{ __('entities.type') }}</th>
                        <th>{{ __('entities.roles') }}</th>
                        <th>{{ __('entities.credit_terms') }}</th>
                        <th>{{ __('entities.kyc_status') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($entities as $entity)
                    <tr>
                        <td>
                            <a href="{{ route('entities.show', $entity) }}"
                               class="font-semibold text-slate-800 hover:text-kojid-green transition-colors">
                                {{ $entity->name }}
                            </a>
                            @if($entity->is_blacklisted)
                                <span class="badge badge-red ml-1">{{ __('entities.blacklisted') }}</span>
                            @endif
                        </td>
                        <td class="font-mono text-sm text-slate-600">{{ $entity->ssm_number }}</td>
                        <td><span class="badge badge-slate uppercase">{{ $entity->entity_type }}</span></td>
                        <td>
                            @foreach($entity->activeRoles as $role)
                                <span class="badge badge-slate text-xs mr-1">{{ $role->role }}</span>
                            @endforeach
                        </td>
                        <td class="uppercase text-sm">{{ $entity->credit_terms }}</td>
                        <td>
                            @if($entity->isVerified())
                                <span class="badge badge-green">{{ __('entities.verified') }}</span>
                            @else
                                <span class="badge badge-amber">{{ __('entities.unverified') }}</span>
                            @endif
                        </td>
                        <td>
                            <a href="{{ route('entities.show', $entity) }}" class="btn-ghost btn-sm">
                                <x-icon name="eye" class="w-4 h-4"/>
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">{{ __('entities.no_entities') }}</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($entities->hasPages())
        <div class="px-6 py-4 border-t border-slate-100">{{ $entities->links() }}</div>
        @endif
    </div>
</div>
@endsection
