package com.autocap.backend.exception;

public class SlugAlreadyExistsException extends RuntimeException {

    public SlugAlreadyExistsException(String message) {
        super(message);
    }
}
