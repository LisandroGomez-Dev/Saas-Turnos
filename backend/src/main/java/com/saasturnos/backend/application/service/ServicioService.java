package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.ServicioDto.ActualizarServicioRequest;
import com.saasturnos.backend.application.dto.ServicioDto.CrearServicioRequest;
import com.saasturnos.backend.application.dto.ServicioDto.ServicioResponse;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.Negocio;
import com.saasturnos.backend.domain.model.Servicio;
import com.saasturnos.backend.infrastructure.repository.ServicioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;
    private final NegocioService negocioService;

    public ServicioService(ServicioRepository servicioRepository, NegocioService negocioService) {
        this.servicioRepository = servicioRepository;
        this.negocioService = negocioService;
    }

    @Transactional(readOnly = true)
    public List<ServicioResponse> listarPorNegocio(Long negocioId) {
        return servicioRepository.findByNegocioIdAndActivoTrueOrderByNombreAsc(negocioId)
                .stream()
                .map(ServicioResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicioResponse obtenerPorId(Long negocioId, Long servicioId) {
        Servicio servicio = buscarEntidad(negocioId, servicioId);
        return ServicioResponse.fromEntity(servicio);
    }

    @Transactional
    public ServicioResponse crear(Long negocioId, CrearServicioRequest req) {
        Negocio negocio = negocioService.buscarEntidad(negocioId);

        Servicio servicio = new Servicio(
                negocio,
                req.nombre(),
                req.descripcion(),
                req.duracionMinutos(),
                req.precio(),
                req.requiereSena(),
                req.montoSena()
        );

        Servicio guardado = servicioRepository.save(servicio);
        return ServicioResponse.fromEntity(guardado);
    }

    @Transactional
    public ServicioResponse actualizar(Long negocioId, Long servicioId, ActualizarServicioRequest req) {
        Servicio servicio = buscarEntidad(negocioId, servicioId);

        servicio.actualizarDatosYCondicionesComerciales(
                req.nombre(),
                req.descripcion(),
                req.duracionMinutos(),
                req.precio(),
                req.requiereSena(),
                req.montoSena(),
                req.activo()
        );

        Servicio guardado = servicioRepository.save(servicio);
        return ServicioResponse.fromEntity(guardado);
    }

    @Transactional
    public void cambiarEstado(Long negocioId, Long servicioId, boolean activo) {
        Servicio servicio = buscarEntidad(negocioId, servicioId);
        servicio.cambiarEstadoActivo(activo);
        servicioRepository.save(servicio);
    }

    @Transactional(readOnly = true)
    public Servicio buscarEntidad(Long negocioId, Long servicioId) {
        return servicioRepository.findByIdAndNegocioId(servicioId, negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Servicio no encontrado con ID: " + servicioId));
    }
}

