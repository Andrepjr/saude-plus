-- Tabelas para sistema de vínculo cuidador-paciente
-- Execute via: node setupVinculos.js  (ou adicione ao setupDb.js)

CREATE TABLE vinculos_codigo (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paciente_id NUMBER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo      VARCHAR2(6)  NOT NULL,
  expira_em   TIMESTAMP    NOT NULL,
  criado_em   TIMESTAMP    DEFAULT SYSTIMESTAMP
);

CREATE TABLE vinculos (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cuidador_id   NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  paciente_id   NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_vinculo  TIMESTAMP DEFAULT SYSTIMESTAMP,
  CONSTRAINT uq_vinculo UNIQUE (cuidador_id, paciente_id)
);

CREATE INDEX idx_vinculos_codigo    ON vinculos_codigo(codigo, expira_em);
CREATE INDEX idx_vinculos_cuidador  ON vinculos(cuidador_id);
CREATE INDEX idx_vinculos_paciente  ON vinculos(paciente_id);
