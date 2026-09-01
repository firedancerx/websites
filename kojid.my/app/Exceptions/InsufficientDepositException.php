<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a deposit is required but has not been received or is insufficient.
 */
class InsufficientDepositException extends RuntimeException {}
