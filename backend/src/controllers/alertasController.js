const OpenAI = require('openai');
const { getConnection } = require('../config/database');
const { resolveTargetId } = require('../utils/resolveTarget');

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });
  return _openai;
}

async function getAlertas(req, res, next) {
  let conn;
  try {
    conn = await getConnection();
    const usuarioId = await resolveTargetId(req, conn);

    const glicoseAlertas = await conn.execute(
      `SELECT 'GLICOSE' AS tipo, valor, data_hora, status
       FROM registros_saude
       WHERE usuario_id = :u_id AND tipo = 'GLICOSE'
       AND status IN ('ALTA','CRITICA')
       AND data_hora >= SYSTIMESTAMP - 1
       ORDER BY data_hora DESC FETCH FIRST 5 ROWS ONLY`,
      { u_id: usuarioId }
    );

    const pressaoAlertas = await conn.execute(
      `SELECT 'PRESSAO' AS tipo, valor, data_hora, status
       FROM registros_saude
       WHERE usuario_id = :u_id AND tipo = 'PRESSAO'
       AND status IN ('ALTA','CRITICA')
       AND data_hora >= SYSTIMESTAMP - 1
       ORDER BY data_hora DESC FETCH FIRST 5 ROWS ONLY`,
      { u_id: usuarioId }
    );

    const medAtrasados = await conn.execute(
      `SELECT m.nome, ml.horario_previsto
       FROM medicamentos m
       LEFT JOIN medicamentos_log ml
         ON ml.medicamento_id = m.id
         AND TRUNC(ml.data_hora) = TRUNC(SYSDATE)
       WHERE m.usuario_id = :u_id AND m.ativo = 1
       AND (ml.tomado IS NULL OR ml.tomado = 0)`,
      { u_id: usuarioId }
    );

    const alertas = [
      ...glicoseAlertas.rows.map(r => ({
        tipo: 'GLICOSE',
        mensagem: `Glicose ${r.STATUS.toLowerCase()}: ${r.VALOR} mg/dL`,
        dataHora: r.DATA_HORA,
        severidade: r.STATUS,
      })),
      ...pressaoAlertas.rows.map(r => ({
        tipo: 'PRESSAO',
        mensagem: `Pressão ${r.STATUS.toLowerCase()}: ${r.VALOR} mmHg`,
        dataHora: r.DATA_HORA,
        severidade: r.STATUS,
      })),
      ...medAtrasados.rows.map(r => ({
        tipo: 'MEDICAMENTO',
        mensagem: `${r.NOME} não tomado${r.HORARIO_PREVISTO ? ` (${r.HORARIO_PREVISTO})` : ''}`,
        dataHora: new Date(),
        severidade: 'MEDIA',
      })),
    ];

    res.json(alertas);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function getAnaliseIA(req, res, next) {
  let conn;
  try {
    conn = await getConnection();
    const usuarioId = await resolveTargetId(req, conn);

    const glicose = await conn.execute(
      `SELECT valor, data_hora, status FROM registros_saude
       WHERE usuario_id = :u_id AND tipo = 'GLICOSE'
       AND data_hora >= SYSTIMESTAMP - 7
       ORDER BY data_hora DESC FETCH FIRST 14 ROWS ONLY`,
      { u_id: usuarioId }
    );

    const pressao = await conn.execute(
      `SELECT valor, data_hora, status FROM registros_saude
       WHERE usuario_id = :u_id AND tipo = 'PRESSAO'
       AND data_hora >= SYSTIMESTAMP - 7
       ORDER BY data_hora DESC FETCH FIRST 14 ROWS ONLY`,
      { u_id: usuarioId }
    );

    const medTomados = await conn.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN tomado = 1 THEN 1 ELSE 0 END) AS tomados
       FROM medicamentos_log
       WHERE usuario_id = :u_id AND data_hora >= SYSTIMESTAMP - 7`,
      { u_id: usuarioId }
    );

    const dados = {
      glicose: glicose.rows.map(r => ({ valor: r.VALOR, data: r.DATA_HORA, status: r.STATUS })),
      pressao: pressao.rows.map(r => ({ valor: r.VALOR, data: r.DATA_HORA, status: r.STATUS })),
      medicamentos: medTomados.rows[0],
    };

    const prompt = `Analise os seguintes dados de saúde dos últimos 7 dias de um paciente idoso:
Glicose: ${JSON.stringify(dados.glicose)}
Pressão arterial: ${JSON.stringify(dados.pressao)}
Medicamentos: ${dados.medicamentos.TOMADOS}/${dados.medicamentos.TOTAL} doses tomadas.

Forneça uma análise breve (3-4 frases) em português brasileiro, destacando tendências preocupantes e uma recomendação prática para o cuidador. Seja objetivo e claro.`;

    let analise;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-...')) {
      analise = '[Modo demo] A glicose do paciente apresentou variação nos últimos 7 dias, com pico de 158 mg/dL. A adesão aos medicamentos está em 67%. Recomenda-se revisar a dieta e garantir que todos os remédios sejam tomados nos horários corretos. Configure a OPENAI_API_KEY para análises reais.';
    } else {
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
      });
      analise = completion.choices[0].message.content;
    }

    res.json({ analise, dados });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = { getAlertas, getAnaliseIA };
