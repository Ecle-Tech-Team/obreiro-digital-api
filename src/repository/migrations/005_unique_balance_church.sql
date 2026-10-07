-- Review historical duplicates and NULL church IDs before applying to an existing database.
-- This migration deliberately fails instead of choosing which balance to keep.
ALTER TABLE saldo
  MODIFY COLUMN id_igreja INT NOT NULL,
  ADD UNIQUE KEY uq_saldo_igreja (id_igreja);
