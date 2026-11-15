package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.NegocioDto.ActualizarNegocioRequest;
import com.saasturnos.backend.application.dto.NegocioDto.NegocioResponse;
import com.saasturnos.backend.domain.model.Negocio;
import com.saasturnos.backend.infrastructure.repository.NegocioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NegocioService {

    private final NegocioRepository negocioRepository;

    public NegocioService(NegocioRepository negocioRepository) {
        this.negocioRepository = negocioRepository;
    }

    @Transactional(readOnly = true)
    public NegocioResponse obtenerPorId(Long id) {
        Negocio negocio = buscarEntidad(id);
        return NegocioResponse.fromEntity(negocio);
    }

    @Transactional(readOnly = true)
    public NegocioResponse obtenerPorSlug(String slug) {
        Negocio negocio = negocioRepository.findBySlugAndActivoTrue(slug)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado con identificador: " + slug));
        return NegocioResponse.fromEntity(negocio);
    }

    @Transactional
    public NegocioResponse actualizar(Long id, ActualizarNegocioRequest req) {
        Negocio negocio = buscarEntidad(id);

        negocio.actualizarPerfilComercial(
                req.nombre(),
                req.telefonoWhatsapp(),
                req.direccion(),
                req.descripcion(),
                req.logoUrl(),
                req.cancelacionHorasMinimas()
        );

        Negocio guardado = negocioRepository.save(negocio);
        return NegocioResponse.fromEntity(guardado);
    }

    @Transactional(readOnly = true)
    public Negocio buscarEntidad(Long id) {
        return negocioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado con ID: " + id));
    }
}

