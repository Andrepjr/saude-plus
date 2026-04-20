const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('123456', 10);

function diasAtras(n, horasAtras = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - horasAtras);
  return d;
}

const idSeq = { usuarios: 2, registros_saude: 18, medicamentos: 6, medicamentos_log: 6, chat_historico: 0 };

function nextId(table) {
  return ++idSeq[table];
}

const store = {
  usuarios: [
    { ID: 1, NOME: 'Maria Silva (Paciente)', EMAIL: 'paciente@teste.com', SENHA: senha, PERFIL: 'PACIENTE', CRIADO_EM: diasAtras(30) },
    { ID: 2, NOME: 'João Cuidador',          EMAIL: 'cuidador@teste.com',  SENHA: senha, PERFIL: 'CUIDADOR',  CRIADO_EM: diasAtras(30) },
  ],
  registros_saude: [
    // Dados do paciente (ID 1)
    { ID: 1,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '95',     DATA_HORA: diasAtras(6), STATUS: 'NORMAL',  FONTE: 'CHAT' },
    { ID: 2,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '132',    DATA_HORA: diasAtras(5), STATUS: 'ALTA',    FONTE: 'CHAT' },
    { ID: 3,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '108',    DATA_HORA: diasAtras(4), STATUS: 'ALTA',    FONTE: 'MANUAL' },
    { ID: 4,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '88',     DATA_HORA: diasAtras(3), STATUS: 'NORMAL',  FONTE: 'CHAT' },
    { ID: 5,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '158',    DATA_HORA: diasAtras(2), STATUS: 'CRITICA', FONTE: 'CHAT' },
    { ID: 6,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '102',    DATA_HORA: diasAtras(1), STATUS: 'ALTA',    FONTE: 'CHAT' },
    { ID: 7,  USUARIO_ID: 1, TIPO: 'GLICOSE', VALOR: '118',    DATA_HORA: diasAtras(0, 2), STATUS: 'ALTA', FONTE: 'CHAT' },
    { ID: 8,  USUARIO_ID: 1, TIPO: 'PRESSAO', VALOR: '150/95', DATA_HORA: diasAtras(2), STATUS: 'ALTA',    FONTE: 'CHAT' },
    { ID: 9,  USUARIO_ID: 1, TIPO: 'PRESSAO', VALOR: '128/82', DATA_HORA: diasAtras(0, 3), STATUS: 'NORMAL', FONTE: 'CHAT' },
    // Dados do cuidador (ID 2) — usados no dashboard quando logado como cuidador
    { ID: 10, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '91',     DATA_HORA: diasAtras(6), STATUS: 'NORMAL',  FONTE: 'MANUAL' },
    { ID: 11, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '145',    DATA_HORA: diasAtras(5), STATUS: 'CRITICA', FONTE: 'CHAT' },
    { ID: 12, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '110',    DATA_HORA: diasAtras(4), STATUS: 'ALTA',    FONTE: 'CHAT' },
    { ID: 13, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '85',     DATA_HORA: diasAtras(3), STATUS: 'NORMAL',  FONTE: 'CHAT' },
    { ID: 14, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '167',    DATA_HORA: diasAtras(2), STATUS: 'CRITICA', FONTE: 'CHAT' },
    { ID: 15, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '120',    DATA_HORA: diasAtras(1), STATUS: 'ALTA',    FONTE: 'CHAT' },
    { ID: 16, USUARIO_ID: 2, TIPO: 'GLICOSE', VALOR: '135',    DATA_HORA: diasAtras(0, 1), STATUS: 'ALTA', FONTE: 'CHAT' },
    { ID: 17, USUARIO_ID: 2, TIPO: 'PRESSAO', VALOR: '160/100', DATA_HORA: diasAtras(0, 2), STATUS: 'CRITICA', FONTE: 'CHAT' },
    { ID: 18, USUARIO_ID: 2, TIPO: 'PRESSAO', VALOR: '142/90', DATA_HORA: diasAtras(1), STATUS: 'ALTA',    FONTE: 'CHAT' },
  ],
  medicamentos: [
    // Medicamentos do paciente (ID 1)
    { ID: 1, USUARIO_ID: 1, NOME: 'Metformina', DOSAGEM: '500mg',  HORARIOS: JSON.stringify(['08:00', '20:00']), ATIVO: 1, CRIADO_EM: diasAtras(30) },
    { ID: 2, USUARIO_ID: 1, NOME: 'Losartana',  DOSAGEM: '50mg',   HORARIOS: JSON.stringify(['07:00']),          ATIVO: 1, CRIADO_EM: diasAtras(30) },
    { ID: 3, USUARIO_ID: 1, NOME: 'Aspirina',   DOSAGEM: '100mg',  HORARIOS: JSON.stringify(['12:00']),          ATIVO: 1, CRIADO_EM: diasAtras(30) },
    // Medicamentos do cuidador (ID 2)
    { ID: 4, USUARIO_ID: 2, NOME: 'Glibenclamida', DOSAGEM: '5mg',   HORARIOS: JSON.stringify(['07:00', '19:00']), ATIVO: 1, CRIADO_EM: diasAtras(30) },
    { ID: 5, USUARIO_ID: 2, NOME: 'Enalapril',     DOSAGEM: '10mg',  HORARIOS: JSON.stringify(['08:00']),          ATIVO: 1, CRIADO_EM: diasAtras(30) },
    { ID: 6, USUARIO_ID: 2, NOME: 'Sinvastatina',  DOSAGEM: '20mg',  HORARIOS: JSON.stringify(['21:00']),          ATIVO: 1, CRIADO_EM: diasAtras(30) },
  ],
  medicamentos_log: [
    // Logs do paciente (ID 1) — hoje
    { ID: 1, MEDICAMENTO_ID: 1, USUARIO_ID: 1, DATA_HORA: new Date(), HORARIO_PREVISTO: '08:00', TOMADO: 1 },
    { ID: 2, MEDICAMENTO_ID: 2, USUARIO_ID: 1, DATA_HORA: new Date(), HORARIO_PREVISTO: '07:00', TOMADO: 1 },
    { ID: 3, MEDICAMENTO_ID: 3, USUARIO_ID: 1, DATA_HORA: new Date(), HORARIO_PREVISTO: '12:00', TOMADO: 0 },
    // Logs do cuidador (ID 2) — hoje
    { ID: 4, MEDICAMENTO_ID: 4, USUARIO_ID: 2, DATA_HORA: new Date(), HORARIO_PREVISTO: '07:00', TOMADO: 1 },
    { ID: 5, MEDICAMENTO_ID: 5, USUARIO_ID: 2, DATA_HORA: new Date(), HORARIO_PREVISTO: '08:00', TOMADO: 0 },
    { ID: 6, MEDICAMENTO_ID: 6, USUARIO_ID: 2, DATA_HORA: new Date(), HORARIO_PREVISTO: '21:00', TOMADO: 0 },
  ],
  chat_historico: [],
};

module.exports = { store, nextId };
