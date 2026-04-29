package com.example.studentcrud.exception;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String message,
        Object details
) {
}
