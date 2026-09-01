@extends('layouts.app')

@section('title', __('notifications.title'))

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="page-title">{{ __('notifications.title') }}</h1>
            <p class="page-subtitle">{{ __('notifications.subtitle') }}</p>
        </div>
        @if($notifications->count() > 0)
        <form method="POST" action="{{ route('notifications.mark-all-read') }}">
            @csrf
            <button type="submit" class="btn btn-outline">
                {{ __('notifications.mark_all_read') }}
            </button>
        </form>
        @endif
    </div>

    <div class="card">
        @forelse($notifications as $notification)
        <div class="px-6 py-4 border-b border-slate-100 {{ $notification->read_at ? 'opacity-60' : '' }}">
            <div class="flex items-start gap-3">
                <div class="flex-1">
                    <div class="font-medium text-slate-800">{{ $notification->title }}</div>
                    <div class="text-sm text-slate-600 mt-1">{{ $notification->message }}</div>
                    <div class="text-xs text-slate-400 mt-2">
                        {{ $notification->created_at->timezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                    </div>
                </div>
                @if(!$notification->read_at)
                <span class="w-2 h-2 rounded-full bg-kojid-green mt-2"></span>
                @endif
            </div>
        </div>
        @empty
        <div class="px-6 py-12 text-center text-slate-400">
            {{ __('notifications.empty') }}
        </div>
        @endforelse
    </div>

    <div class="mt-4">
        {{ $notifications->links() }}
    </div>
</div>
@endsection
