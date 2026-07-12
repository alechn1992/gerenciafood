-- Adiciona campos de sincronização via API à tabela insumos.
ALTER TABLE insumos
  ADD COLUMN IF NOT EXISTS categoria        text,
  ADD COLUMN IF NOT EXISTS codigo_externo   text,
  ADD COLUMN IF NOT EXISTS sincronizado_em  timestamptz;

CREATE INDEX IF NOT EXISTS idx_insumos_codigo_externo ON insumos (codigo_externo)
  WHERE codigo_externo IS NOT NULL;
