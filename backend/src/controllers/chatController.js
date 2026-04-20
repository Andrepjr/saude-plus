const OpenAI = require('openai');
const { getConnection } = require('../config/database');

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });
  return _openai;
}

const SYSTEM_PROMPT = `Você é Abby, uma assistente de saúde gentil e cuidadosa especializada em monitoramento de idosos.
Você ajuda pacientes a registrar sua glicose e pressão arterial de forma conversacional.
Quando o paciente mencionar valores de glicose ou pressão, confirme o registro de forma calorosa.
Fale sempre em português brasileiro, de forma simples e acolhedora.
Nunca forneça diagnósticos médicos, apenas oriente a consultar um médico quando necessário.`;

const GLICOSE_REGEX = /glicose[:\s]+(\d{2,3})\s*(mg\/dl|mgdl)?/i;

// Aceita qualquer texto entre "pressao/pressão" e os números (ex: "arterial", "está", "é de")
// Separadores: / | x | por
// Notação abreviada: "12 por 8" → expandida para 120/80 no handler
const PRESSAO_REGEX = /press[aã]o(?:[^0-9]{0,40})(\d{1,3})\s*(?:\/|x|\bpor\b)\s*(\d{1,3})/i;

function classificarGlicose(valor) {
  if (valor < 70) return 'BAIXA';
  if (valor <= 99) return 'NORMAL';
  if (valor <= 125) return 'ALTA';
  return 'CRITICA';
}

function classificarPressao(sistolica, diastolica) {
  if (sistolica >= 180 || diastolica >= 120) return 'CRITICA';
  if (sistolica >= 140 || diastolica >= 90) return 'ALTA';
  if (sistolica < 90 || diastolica < 60) return 'BAIXA';
  return 'NORMAL';
}

async function salvarRegistro(conn, usuarioId, tp, valor, st) {
  await conn.execute(
    `INSERT INTO registros_saude (usuario_id, tipo, valor, status, fonte)
     VALUES (:u_id, :tp, :valor, :st, 'CHAT')`,
    { u_id: usuarioId, tp, valor, st }
  );
}

async function sendMessage(req, res, next) {
  const { mensagem } = req.body;
  const usuarioId = req.user.id;
  let conn;

  try {
    conn = await getConnection();

    const histResult = await conn.execute(
      `SELECT role, conteudo FROM chat_historico
       WHERE usuario_id = :u_id ORDER BY criado_em DESC FETCH FIRST 10 ROWS ONLY`,
      { u_id: usuarioId }
    );
    const history = histResult.rows.reverse().map(r => ({
      role: String(r.ROLE),
      content: String(r.CONTEUDO),
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: mensagem },
    ];

    let resposta;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-...')) {
      resposta = `[Modo demo — OpenAI não configurada] Recebi sua mensagem: "${mensagem}". Configure OPENAI_API_KEY no .env para ativar a IA real.`;
    } else {
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });
      resposta = completion.choices[0].message.content;
    }

    await conn.execute(
      `INSERT INTO chat_historico (usuario_id, role, conteudo) VALUES (:u_id, 'user', :msg)`,
      { u_id: usuarioId, msg: mensagem }
    );
    await conn.execute(
      `INSERT INTO chat_historico (usuario_id, role, conteudo) VALUES (:u_id, 'assistant', :msg)`,
      { u_id: usuarioId, msg: resposta }
    );

    const registros = [];
    const glicoseMatch = mensagem.match(GLICOSE_REGEX);
    if (glicoseMatch) {
      const valor = parseInt(glicoseMatch[1]);
      const st = classificarGlicose(valor);
      await salvarRegistro(conn, usuarioId, 'GLICOSE', String(valor), st);
      registros.push({ tipo: 'GLICOSE', valor, status: st });
    }

    const pressaoMatch = mensagem.match(PRESSAO_REGEX);
    if (pressaoMatch) {
      let sistolica  = parseInt(pressaoMatch[1]);
      let diastolica = parseInt(pressaoMatch[2]);
      // Notação abreviada: "12 por 8" significa 120/80 — idosos omitem o zero final
      if (sistolica < 30) { sistolica *= 10; diastolica *= 10; }
      const valor = `${sistolica}/${diastolica}`;
      const st = classificarPressao(sistolica, diastolica);
      await salvarRegistro(conn, usuarioId, 'PRESSAO', valor, st);
      registros.push({ tipo: 'PRESSAO', valor, status: st });
    }

    res.json({ resposta, registros });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function getHistorico(req, res, next) {
  const usuarioId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT role, conteudo, criado_em FROM chat_historico
       WHERE usuario_id = :u_id ORDER BY criado_em ASC FETCH FIRST 50 ROWS ONLY`,
      { u_id: usuarioId }
    );
    res.json(result.rows.map(r => ({
      role: r.ROLE,
      content: r.CONTEUDO,
      createdAt: r.CRIADO_EM,
    })));
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = { sendMessage, getHistorico };
