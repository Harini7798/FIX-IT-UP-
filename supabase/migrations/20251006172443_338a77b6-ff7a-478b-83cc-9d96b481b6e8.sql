-- Add new status to repair_status enum (must be done first)
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';