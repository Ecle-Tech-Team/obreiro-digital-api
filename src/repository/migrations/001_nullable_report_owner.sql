-- Execute em ambiente controlado após backup e validação do schema instalado.
-- Preserva relatos quando a conta associada é removida.
ALTER TABLE bug_reports MODIFY COLUMN id_user INT NULL;
