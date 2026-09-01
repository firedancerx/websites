<?php

namespace App\Http\Requests\Entity;

use App\Models\Entity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Services\TenantContextService;

/**
 * RegisterEntityRequest
 *
 * Validates entity registration. Enforces SSM uniqueness within tenant scope.
 */
class RegisterEntityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Entity::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'entity_type' => strtolower((string) $this->input('entity_type')),
            'credit_terms' => strtolower((string) $this->input('credit_terms', 'cod')),
        ]);
    }

    public function rules(): array
    {
        $tenantId = TenantContextService::currentId();

        return [
            'name'          => ['required', 'string', 'max:150'],
            'ssm_number'    => [
                'required', 'string', 'max:30',
                Rule::unique('entities')->where('tenant_id', $tenantId),
            ],
            'ic_owner'      => ['nullable', 'string', 'max:20'],
            'entity_type'   => ['required', 'in:supplier,buyer,quota_holder,intermediary'],
            'bank_account'  => ['nullable', 'string', 'max:30'],
            'bank_name'     => ['nullable', 'string', 'max:60'],
            'contact_phone' => ['required', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email'],
            'address'       => ['nullable', 'string', 'max:500'],
            'credit_terms'  => ['nullable', 'in:cod,net7,net14,net30,custom'],
            'credit_days'   => ['nullable', 'integer', 'min:0', 'max:365'],
            'credit_limit'  => ['nullable', 'numeric', 'min:0'],
            'deposit_rate_override' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes'         => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'ssm_number.unique' => __('entities.validation.ssm_duplicate'),
        ];
    }
}
