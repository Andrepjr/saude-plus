const VOICE_ID = 'cNYrMw9glwJZXR8RwbuR';
const MODEL_ID  = 'eleven_flash_v2_5';
const API_URL   = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

async function textToSpeech(req, res) {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('[TTS] ELEVENLABS_API_KEY not configured');
    return res.status(503).json({ error: 'TTS not configured' });
  }

  const apiRes = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 1000),
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    console.error('[TTS] ElevenLabs error:', apiRes.status, errText);
    return res.status(502).json({ error: 'TTS service error' });
  }

  const buffer = Buffer.from(await apiRes.arrayBuffer());
  res.set('Content-Type', 'audio/mpeg');
  res.set('Content-Length', buffer.length);
  res.send(buffer);
}

module.exports = { textToSpeech };
