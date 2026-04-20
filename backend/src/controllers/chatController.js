const OpenAI = require('openai');
const { getConnection } = require('../config/database');

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });
  return _openai;
}

// Tag emitida pelo modelo para registrar tomada de medicamento.
// Parseada pelo backend após receber a resposta; removida antes de enviar ao frontend.
const MED_TAG_REGEX = /\[MEDICAMENTO\](\{[\s\S]*?\})\[\/MEDICAMENTO\]/i;

const GLICOSE_REGEX = /glicose[:\s]+(\d{2,3})\s*(mg\/dl|mgdl)?/i;

// Aceita qualquer texto entre "pressao/pressão" e os números
// Separadores: / | x | por | Notação abreviada: "12 por 8" → 120/80
const PRESSAO_REGEX = /press[aã]o(?:[^0-9]{0,40})(\d{1,3})\s*(?:\/|x|\bpor\b)\s*(\d{1,3})/i;

function buildSystemPrompt(meds, nomeCompleto) {
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  const primeiroNome = nomeCompleto ? nomeCompleto.split(' ')[0] : null;

  let prompt = `Você é Abby, uma assistente de saúde gentil e cuidadosa especializada em monitoramento de idosos.
Você ajuda pacientes a registrar sua glicose, pressão arterial e medicamentos de forma conversacional.
Quando o paciente mencionar valores de glicose ou pressão, confirme o registro de forma calorosa.
Fale sempre em português brasileiro, de forma simples e acolhedora.
Nunca forneça diagnósticos médicos, apenas oriente a consultar um médico quando necessário.
Horário atual: ${horaAtual}.${primeiroNome ? `\nO nome do paciente é ${primeiroNome}. Chame-o(a) pelo primeiro nome de forma natural e afetuosa ao longo da conversa.` : ''}`;

  if (meds.length > 0) {
    const medList = meds.map(m => {
      const d = m.dosagem ? ` ${m.dosagem}` : '';
      const h = m.horarios.length > 0 ? ` (horários: ${m.horarios.join(', ')})` : '';
      return `- ${m.nome}${d}${h}`;
    }).join('\n');

    prompt += `

Medicamentos prescritos do paciente:
${medList}

INSTRUÇÃO ESPECIAL — REGISTRO DE MEDICAMENTO:
Quando o paciente confirmar que tomou qualquer medicamento da lista acima, você DEVE:
1. Responder de forma acolhedora confirmando o registro.
2. Incluir OBRIGATORIAMENTE ao final da resposta a seguinte tag (e apenas uma):

[MEDICAMENTO]{"nome":"<nome exato conforme lista>","horario":"<HH:MM>"}[/MEDICAMENTO]

Regras da tag:
- "nome" deve ser EXATAMENTE igual ao nome na lista acima (mesma capitalização).
- "horario" deve estar no formato HH:MM. Se o paciente informar, use o horário informado. Se não informar, escolha o horário agendado mais próximo do horário atual (${horaAtual}).
- Inclua a tag SOMENTE quando tiver certeza que o paciente tomou um medicamento da lista.
- NÃO inclua a tag em outros casos (dúvidas, perguntas, etc.).`;
  }

  return prompt;
}

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

async function registrarTomadaDB(conn, medId, usuarioId, horario) {
  const check = await conn.execute(
    `SELECT id FROM medicamentos_log
     WHERE medicamento_id = :mid AND usuario_id = :u_id
     AND TRUNC(data_hora) = TRUNC(SYSDATE)
     AND horario_previsto = :hp`,
    { mid: medId, u_id: usuarioId, hp: horario }
  );
  if (check.rows.length > 0) {
    await conn.execute(
      `UPDATE medicamentos_log SET tomado = 1, data_hora = SYSTIMESTAMP WHERE id = :log_id`,
      { log_id: check.rows[0].ID }
    );
    console.log(`[chat] medicamentos_log UPDATE id=${check.rows[0].ID}`);
  } else {
    await conn.execute(
      `INSERT INTO medicamentos_log (medicamento_id, usuario_id, horario_previsto, tomado)
       VALUES (:mid, :u_id, :hp, 1)`,
      { mid: medId, u_id: usuarioId, hp: horario }
    );
    console.log(`[chat] medicamentos_log INSERT med_id=${medId} hp=${horario}`);
  }
}

async function sendMessage(req, res, next) {
  const { mensagem } = req.body;
  const usuarioId = req.user.id;
  let conn;

  try {
    conn = await getConnection();

    // Busca medicamentos ativos do paciente
    const medsResult = await conn.execute(
      `SELECT id, nome, dosagem, horarios FROM medicamentos
       WHERE usuario_id = :u_id AND ativo = 1 ORDER BY nome`,
      { u_id: usuarioId }
    );
    const meds = medsResult.rows.map(r => ({
      id: r.ID,
      nome: String(r.NOME),
      dosagem: r.DOSAGEM ? String(r.DOSAGEM) : null,
      horarios: JSON.parse(r.HORARIOS || '[]'),
    }));

    // Histórico de chat
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
      { role: 'system', content: buildSystemPrompt(meds, req.user.nome) },
      ...history,
      { role: 'user', content: mensagem },
    ];

    // Resposta da OpenAI (ou modo demo)
    let respostaBruta;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-...')) {
      respostaBruta = `[Modo demo — OpenAI não configurada] Recebi: "${mensagem}". Configure OPENAI_API_KEY no .env.`;
    } else {
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });
      respostaBruta = completion.choices[0].message.content;
    }

    console.log('[chat] Resposta bruta do modelo:', respostaBruta);

    // Parse da tag [MEDICAMENTO] emitida pelo modelo
    const registros = [];
    const medTagMatch = respostaBruta.match(MED_TAG_REGEX);

    if (medTagMatch) {
      console.log('[chat] Tag [MEDICAMENTO] detectada:', medTagMatch[1]);
      try {
        const payload = JSON.parse(medTagMatch[1]);
        const nomeTag = (payload.nome || '').trim();
        const horarioTag = (payload.horario || '').trim();

        // Valida o medicamento contra a lista real do paciente (case-insensitive)
        const medEncontrado = meds.find(
          m => m.nome.toLowerCase() === nomeTag.toLowerCase()
        );

        if (!medEncontrado) {
          console.log(`[chat] Medicamento da tag ("${nomeTag}") não encontrado na lista. Meds:`, meds.map(m => m.nome));
        } else if (!horarioTag) {
          console.log('[chat] Tag sem campo "horario" — ignorando registro.');
        } else {
          console.log(`[chat] Medicamento detectado: ${medEncontrado.nome} | horário: ${horarioTag}`);
          await registrarTomadaDB(conn, medEncontrado.id, usuarioId, horarioTag);
          registros.push({ tipo: 'MEDICAMENTO', nome: medEncontrado.nome, horario: horarioTag });
        }
      } catch (parseErr) {
        console.log('[chat] Erro ao fazer parse do JSON da tag:', parseErr.message, '| Raw:', medTagMatch[1]);
      }
    }

    // Remove a tag da resposta antes de salvar no histórico e enviar ao frontend
    const resposta = respostaBruta.replace(MED_TAG_REGEX, '').trim();

    // Salva no histórico já sem a tag
    await conn.execute(
      `INSERT INTO chat_historico (usuario_id, role, conteudo) VALUES (:u_id, 'user', :msg)`,
      { u_id: usuarioId, msg: mensagem }
    );
    await conn.execute(
      `INSERT INTO chat_historico (usuario_id, role, conteudo) VALUES (:u_id, 'assistant', :msg)`,
      { u_id: usuarioId, msg: resposta }
    );

    // Glicose e pressão ainda detectados por regex (formato numérico, sem ambiguidade)
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
