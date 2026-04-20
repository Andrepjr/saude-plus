-- Saúde+ | Oracle Autonomous Database Schema

CREATE TABLE usuarios (
    id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR2(100)  NOT NULL,
    perfil     VARCHAR2(20)   NOT NULL CHECK (perfil IN ('PACIENTE', 'CUIDADOR')),
    email      VARCHAR2(100)  UNIQUE NOT NULL,
    senha      VARCHAR2(255)  NOT NULL,
    criado_em  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicamentos (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome        VARCHAR2(100) NOT NULL,
    dosagem     VARCHAR2(50),
    horarios    VARCHAR2(500),  -- JSON array ex: ["08:00","14:00","20:00"]
    ativo       NUMBER(1)     DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registros_saude (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        VARCHAR2(20) NOT NULL CHECK (tipo IN ('GLICOSE', 'PRESSAO')),
    valor       VARCHAR2(50) NOT NULL,
    data_hora   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    status      VARCHAR2(20) DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'ALTA', 'BAIXA', 'CRITICA')),
    fonte       VARCHAR2(20) DEFAULT 'CHAT' CHECK (fonte IN ('CHAT', 'MANUAL'))
);

CREATE TABLE medicamentos_log (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medicamento_id  NUMBER    NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    usuario_id      NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_hora       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    horario_previsto VARCHAR2(10),
    tomado          NUMBER(1) DEFAULT 0 CHECK (tomado IN (0, 1))
);

CREATE TABLE chat_historico (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    role        VARCHAR2(20)  NOT NULL CHECK (role IN ('user', 'assistant')),
    conteudo    CLOB          NOT NULL,
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_registros_usuario ON registros_saude(usuario_id, data_hora DESC);
CREATE INDEX idx_med_log_usuario   ON medicamentos_log(usuario_id, data_hora DESC);
CREATE INDEX idx_chat_usuario      ON chat_historico(usuario_id, criado_em DESC);
CREATE INDEX idx_med_usuario       ON medicamentos(usuario_id);
