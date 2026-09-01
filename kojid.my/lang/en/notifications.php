<?php // lang/en/notifications.php
return [
    'order_state_changed_title' => 'Order :number Status Updated',
    'order_state_changed_body'  => 'Order :number has transitioned from :from to :to.',
    'guillotina_warning_title'  => '⚠ Guillotina Warning — :hours hours remaining',
    'guillotina_warning_body'   => 'Order :number will be automatically cancelled at :time if no action is taken.',
    'guillotina_fired_title'    => '🔴 Guillotina Executed — :number',
    'guillotina_fired_body'     => 'Order :number has been cancelled and deposit forfeited due to SLA breach.',
    'deposit_received_title'    => 'Deposit Received',
    'deposit_received_body'     => 'Deposit RM :amount for order :order has been received.',
    'settlement_completed_title'=> 'Settlement Complete',
    'settlement_completed_body' => 'Order :order has been fully settled.',
];
