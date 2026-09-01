<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Message;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * SendOrderNotification
 *
 * Queued email delivery for all KOJID business event notifications.
 * Uses simple Mail::raw() for now; can be upgraded to Mailable classes.
 * Queued on 'notifications' queue — lower priority than critical financial jobs.
 */
class SendOrderNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int    $tries   = 3;
    public string $queue   = 'notifications';

    public function __construct(
        private readonly User    $user,
        private readonly string  $type,
        private readonly string  $title,
        private readonly string  $body,
        private readonly ?string $actionUrl = null,
    ) {}

    public function handle(): void
    {
        try {
            Mail::send([], [], function (Message $message) {
                $actionLine = $this->actionUrl
                    ? "\n\nView in KOJID: {$this->actionUrl}"
                    : '';

                $message
                    ->to($this->user->email, $this->user->name)
                    ->subject("[KOJID] {$this->title}")
                    ->setBody(
                        "{$this->body}{$actionLine}\n\n" .
                        "---\nKOJID — Kinetics Food Chain\n" .
                        "This is an automated notification. Do not reply to this email.",
                        'text/plain'
                    );
            });

            Log::info('SendOrderNotification: email sent', [
                'user_id' => $this->user->id,
                'type'    => $this->type,
            ]);

        } catch (\Throwable $e) {
            Log::warning('SendOrderNotification: email failed', [
                'user_id' => $this->user->id,
                'error'   => $e->getMessage(),
            ]);
            // Don't rethrow — notification failure must never break the main flow
        }
    }
}
