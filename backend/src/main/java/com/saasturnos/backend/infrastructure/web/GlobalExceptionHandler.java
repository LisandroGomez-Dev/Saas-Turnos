package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.exception.SlotOcupadoException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLocking(OptimisticLockingFailureException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "El turno o recurso acaba de ser modificado por otra persona al mismo instante. Por favor, actualizá los horarios disponibles e intentá nuevamente."
        );
        problem.setTitle("Conflicto de Concurrencia (Bloqueo Optimista)");
        problem.setType(URI.create("https://api.saasturnos.com/errors/concurrency-conflict"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "OPTIMISTIC_LOCK_ERROR");
        return problem;
    }

    @ExceptionHandler(SlotOcupadoException.class)
    public ProblemDetail handleSlotOcupado(SlotOcupadoException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
        problem.setTitle("Horario No Disponible");
        problem.setType(URI.create("https://api.saasturnos.com/errors/slot-taken"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "SLOT_ALREADY_TAKEN");
        return problem;
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleEntityNotFound(EntityNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        problem.setTitle("Recurso No Encontrado");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "RESOURCE_NOT_FOUND");
        return problem;
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problem.setTitle("Regla de Negocio Incumplida");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "BUSINESS_RULE_VIOLATION");
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Uno o más campos no cumplen con las validaciones requeridas."
        );
        problem.setTitle("Error de Validación de Datos");

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );
        problem.setProperty("invalidParams", fieldErrors);
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "VALIDATION_ERROR");
        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "El registro entra en conflicto con datos existentes (por ejemplo, un identificador o slug duplicado)."
        );
        problem.setTitle("Conflicto de Integridad de Datos");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("code", "DATA_INTEGRITY_CONFLICT");
        return problem;
    }
}

