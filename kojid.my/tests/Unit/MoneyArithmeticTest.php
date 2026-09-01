<?php

use Brick\Money\Money;
use Brick\Money\Currency;
use App\Traits\HasOrderNumber;
use Illuminate\Support\Facades\Cache;

// ─────────────────────────────────────────────────────────────────────────────
// MoneyArithmeticTest
// ─────────────────────────────────────────────────────────────────────────────

describe('Money Arithmetic', function () {

    it('brick/money addition is precise', function () {
        $a = Money::of('0.10', 'MYR');
        $b = Money::of('0.20', 'MYR');
        $c = $a->plus($b);

        expect($c->getAmount()->__toString())->toBe('0.30')
            ->and($c->getAmount()->__toString())->not->toBe('0.30000000000000004');
    });

    it('deposit calculation at 30% is exact', function () {
        $orderAmount = Money::of('10000.00', 'MYR');
        $rate        = '0.30';
        $deposit     = $orderAmount->multipliedBy($rate, \Brick\Math\RoundingMode::HALF_UP);

        expect($deposit->getAmount()->__toString())->toBe('3000.00');
    });

    it('quad-party margin calculation is exact', function () {
        $sale      = Money::of('10000.00', 'MYR');
        $goods     = Money::of('7000.00',  'MYR');
        $quota     = Money::of('500.00',   'MYR');
        $logistics = Money::of('200.00',   'MYR');

        $margin = $sale->minus($goods)->minus($quota)->minus($logistics);

        expect($margin->getAmount()->__toString())->toBe('2300.00');
    });

    it('bcmath multiplication produces correct results', function () {
        $qty   = '100.500';
        $price = '21.50';
        $total = bcmul($qty, $price, 2);

        expect($total)->toBe('2160.75');
    });

    it('bcadd accumulation is precise across many items', function () {
        $items = ['100.10', '200.20', '300.30', '400.40', '500.50'];
        $total = array_reduce($items, fn ($c, $v) => bcadd($c, $v, 2), '0.00');

        expect($total)->toBe('1501.50');
    });

    it('float arithmetic would produce incorrect results (demonstrating why we avoid it)', function () {
        // This demonstrates the float problem we are explicitly preventing
        $floatResult = 0.10 + 0.20;
        expect($floatResult)->not->toBe(0.30); // Proves floats are unreliable for money
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// OrderNumberGeneratorTest
// ─────────────────────────────────────────────────────────────────────────────

describe('Order Number Generator', function () {

    beforeEach(function () {
        // Clear any cached sequences before each test
        Cache::store('array')->flush();
    });

    it('generates correct inbound order number format', function () {
        // Bypass real Redis; use array cache for unit tests
        Config::set('cache.default', 'array');

        $number = HasOrderNumber::generateOrderNumber(1, 'inbound');

        expect($number)->toMatch('/^MSK-\d{4}-\d{4}-\d{5}$/');
    });

    it('generates correct outbound order number format', function () {
        Config::set('cache.default', 'array');

        $number = HasOrderNumber::generateOrderNumber(1, 'outbound');

        expect($number)->toMatch('/^KLR-\d{4}-\d{4}-\d{5}$/');
    });

    it('increments sequence for same tenant same day', function () {
        Config::set('cache.default', 'array');

        $first  = HasOrderNumber::generateOrderNumber(1, 'inbound');
        $second = HasOrderNumber::generateOrderNumber(1, 'inbound');

        $firstSeq  = (int) substr($first, -5);
        $secondSeq = (int) substr($second, -5);

        expect($secondSeq)->toBe($firstSeq + 1);
    });

    it('sequences are independent per tenant', function () {
        Config::set('cache.default', 'array');

        $tenant1First  = HasOrderNumber::generateOrderNumber(1, 'inbound');
        $tenant2First  = HasOrderNumber::generateOrderNumber(2, 'inbound');

        $seq1 = (int) substr($tenant1First, -5);
        $seq2 = (int) substr($tenant2First, -5);

        // Both should start at 1 independently
        expect($seq1)->toBe(1)
            ->and($seq2)->toBe(1);
    });

    it('sequences are independent per type', function () {
        Config::set('cache.default', 'array');

        $inbound  = HasOrderNumber::generateOrderNumber(1, 'inbound');
        $outbound = HasOrderNumber::generateOrderNumber(1, 'outbound');

        expect($inbound)->toStartWith('MSK-')
            ->and($outbound)->toStartWith('KLR-')
            ->and(substr($inbound, -5))->toBe('00001')
            ->and(substr($outbound, -5))->toBe('00001');
    });

    it('pads sequence to 5 digits', function () {
        Config::set('cache.default', 'array');
        $number = HasOrderNumber::generateOrderNumber(99, 'inbound');
        expect(substr($number, -5))->toMatch('/^\d{5}$/');
    });
});
