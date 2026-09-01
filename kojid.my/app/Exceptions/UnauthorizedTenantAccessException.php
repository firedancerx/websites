<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a user attempts to access a resource belonging to a different tenant.
 */
class UnauthorizedTenantAccessException extends RuntimeException
{
    public function __construct(string $message = 'Access to this resource is not permitted for your tenant.')
    {
        parent::__construct($message);
    }
}
