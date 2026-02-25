-- Eliminar grades duplicados (IDs 15-28 son copias de 1-14)
DELETE FROM grades WHERE id IN (15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28);