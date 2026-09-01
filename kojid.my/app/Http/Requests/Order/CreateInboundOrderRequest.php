<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

/**
 * CreateInboundOrderRequest
 *
 * Validates all fields required to create a new inbound (MSK-) order.
 * Line items are validated as an array with per-item rules.
 */
class CreateInboundOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole(['tenant_admin', 'procurement_officer']);
    }

    public function rules(): array
    {
        return [
            'entity_id'              => ['required', 'integer', 'exists:entities,id'],
            'payment_terms'          => ['nullable', 'in:cod,net7,net14,net30,custom'],
            'notes'                  => ['nullable', 'string', 'max:1000'],
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'       => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_price'     => ['required', 'numeric', 'min:0.01'],
            'items.*.quota_fee_per_unit' => ['nullable', 'numeric', 'min:0'],
            'items.*.logistics_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'entity_id.required'         => __('orders.validation.entity_required'),
            'items.required'             => __('orders.validation.items_required'),
            'items.*.product_id.required' => __('orders.validation.product_required'),
            'items.*.quantity.min'       => __('orders.validation.quantity_positive'),
            'items.*.unit_price.min'     => __('orders.validation.price_positive'),
        ];
    }
}
