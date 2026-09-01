<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOutboundOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole(['tenant_admin', 'sales_officer']);
    }

    public function rules(): array
    {
        return [
            'entity_id'                   => ['required', 'integer', 'exists:entities,id'],
            'quota_holder_entity_id'      => ['nullable', 'integer', 'exists:entities,id'],
            'payment_terms'               => ['nullable', 'in:cod,net7,net14,net30,custom'],
            'notes'                       => ['nullable', 'string', 'max:1000'],
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.product_id'          => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'            => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_price'          => ['required', 'numeric', 'min:0.01'],
            'items.*.quota_fee_per_unit'  => ['nullable', 'numeric', 'min:0'],
            'items.*.logistics_cost'      => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
