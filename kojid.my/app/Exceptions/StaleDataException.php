<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when an optimistic lock conflict is detected on a versioned record.
 */
class StaleDataException extends RuntimeException {}
