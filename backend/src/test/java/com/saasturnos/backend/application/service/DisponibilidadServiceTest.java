package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.DisponibilidadDto.SlotDisponibleResponse;
import com.saasturnos.backend.domain.model.*;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.infrastructure.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

import static com.saasturnos.backend.application.service.DisponibilidadService.ZONA_ARGENTINA;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisponibilidadServiceTest {

        @Mock
        private NegocioRepository negocioRepository;
        @Mock
        private ServicioRepository servicioRepository;
        @Mock
        private ProfesionalRepository profesionalRepository;
        @Mock
        private HorarioLaboralRepository horarioLaboralRepository;
        @Mock
        private BloqueoHorarioRepository bloqueoHorarioRepository;
        @Mock
        private TurnoRepository turnoRepository;

        @InjectMocks
        private DisponibilidadService disponibilidadService;

        private Profesional barbero;
        private Servicio corte40Min;
        private LocalDate fechaFutura;
        private OffsetDateTime ahora;

        @BeforeEach
        void setUp() {
                Negocio negocio = new Negocio("Barbería", "barberia", "5491122334455");
                barbero = new Profesional(negocio, "Lisandro", "Barbero", null, "#4F46E5", true);
                corte40Min = new Servicio(negocio, "Corte Degradé", null, 40, new BigDecimal("10000"), true,
                                new BigDecimal("3000"));

                ahora = ZonedDateTime.of(2026, 11, 2, 8, 0, 0, 0, ZONA_ARGENTINA).toOffsetDateTime();
                fechaFutura = LocalDate.of(2026, 11, 3); // Martes (diaSemana = 2)
        }

        @Test
        @DisplayName("Calcula correctamente los slots en horario cortado (09:00-13:00 y 16:00-20:00) para servicio de 40 min")
        void calculaSlotsHorarioCortado() {
                HorarioLaboral manana = crearFranja((short) 2, LocalTime.of(9, 0), LocalTime.of(13, 0));
                HorarioLaboral tarde = crearFranja((short) 2, LocalTime.of(16, 0), LocalTime.of(20, 0));

                when(horarioLaboralRepository.findByProfesionalIdAndDiaSemanaAndActivoTrueOrderByHoraInicioAsc(any(),
                                eq((short) 2)))
                                .thenReturn(List.of(manana, tarde));
                when(turnoRepository.findTurnosOcupadosSolapados(any(), any(), any(), any()))
                                .thenReturn(List.of());
                when(bloqueoHorarioRepository.findSolapadosEnRango(any(), any(), any()))
                                .thenReturn(List.of());

                List<SlotDisponibleResponse> slots = disponibilidadService.calcularSlotsParaProfesional(
                                barbero, corte40Min, fechaFutura, ahora);

                // 4 horas a la mañana (240 min / 40 min = 6 turnos) + 4 horas a la tarde (6
                // turnos) = 12 turnos exactos
                assertEquals(12, slots.size());
                assertEquals("09:00", slots.get(0).horaInicioFormateada());
                assertEquals("09:40", slots.get(0).horaFinFormateada());
                assertEquals("12:20", slots.get(5).horaInicioFormateada());
                assertEquals("13:00", slots.get(5).horaFinFormateada());
                assertEquals("16:00", slots.get(6).horaInicioFormateada());
        }

        @Test
        @DisplayName("Empaqueta sin tiempos muertos cuando hay un turno previo de 30 min e ignora reservas PENDIENTE_PAGO expiradas")
        void empaquetaSinTiemposMuertosYLiberaExpirados() {
                HorarioLaboral manana = crearFranja((short) 2, LocalTime.of(9, 0), LocalTime.of(11, 0));

                Negocio negocio = new Negocio("Barbería", "barberia", "5491122334455");
                Servicio barba30Min = new Servicio(negocio, "Barba Express", null, 30, new BigDecimal("6000"), true,
                                new BigDecimal("2000"));

                // Turno confirmado de 09:00 a 09:30 (ej. Barba Express de 30 min) creado con
                // Factory Method
                Turno turnoOcupado = Turno.crearTurnoManualMostrador(
                                "TRN-OCUP01",
                                negocio,
                                barbero,
                                barba30Min,
                                ZonedDateTime.of(fechaFutura, LocalTime.of(9, 0), ZONA_ARGENTINA).toOffsetDateTime(),
                                "Cliente Ocupado",
                                "1122334455",
                                null,
                                true);

                // Turno PENDIENTE_PAGO pero ya expirado (expiraEn anterior a 'ahora') -> debe
                // ser ignorado
                Turno turnoExpirado = Turno.crearReservaWebPublica(
                                "TRN-EXP001",
                                negocio,
                                barbero,
                                corte40Min,
                                ZonedDateTime.of(fechaFutura, LocalTime.of(9, 30), ZONA_ARGENTINA).toOffsetDateTime(),
                                "Cliente Expirado",
                                "1199887766",
                                null,
                                null,
                                ahora.minusMinutes(15),
                                10);

                when(horarioLaboralRepository.findByProfesionalIdAndDiaSemanaAndActivoTrueOrderByHoraInicioAsc(any(),
                                eq((short) 2)))
                                .thenReturn(List.of(manana));
                when(turnoRepository.findTurnosOcupadosSolapados(any(), any(), any(), any()))
                                .thenReturn(List.of(turnoOcupado, turnoExpirado));
                when(bloqueoHorarioRepository.findSolapadosEnRango(any(), any(), any()))
                                .thenReturn(List.of());

                List<SlotDisponibleResponse> slots = disponibilidadService.calcularSlotsParaProfesional(
                                barbero, corte40Min, fechaFutura, ahora);

                // El primer hueco disponible debe arrancar exactamente a las 09:30 (fin del
                // turno ocupado), no a las 09:40!
                assertEquals(2, slots.size());
                assertEquals("09:30", slots.get(0).horaInicioFormateada());
                assertEquals("10:10", slots.get(0).horaFinFormateada());
                assertEquals("10:10", slots.get(1).horaInicioFormateada());
                assertEquals("10:50", slots.get(1).horaFinFormateada());
        }

        private HorarioLaboral crearFranja(short dia, LocalTime inicio, LocalTime fin) {
                return new HorarioLaboral(barbero, dia, inicio, fin);
        }
}
