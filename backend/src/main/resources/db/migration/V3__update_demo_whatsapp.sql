-- ==============================================================================
-- V3__update_demo_whatsapp.sql
-- Actualiza el WhatsApp de los negocios demo al número del autor (+54 9 379 5074605)
-- ==============================================================================

UPDATE negocios
SET telefono_whatsapp = '5493795074605',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (1, 2);
