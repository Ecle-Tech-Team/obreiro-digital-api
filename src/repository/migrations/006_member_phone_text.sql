-- Celular do membro era INT: números com DDD (11 dígitos) estouravam o limite e
-- textos formatados eram rejeitados. Valores existentes são preservados como texto.
ALTER TABLE membro MODIFY COLUMN numero VARCHAR(20) NULL;
