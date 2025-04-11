import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors({
  origin: '*'
}));
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DID_API_KEY = process.env.DID_API_KEY;

app.post('/salma', async (req, res) => {
    const { userMessage } = req.body;
    
    try {
        // 1. Get AI reply (Text)
        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are Salma, a friendly Egyptian Arabic real estate consultant. Speak only in Egyptian Arabic.' },
                { role: 'user', content: userMessage }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`
            }
        });

        const aiText = gptResponse.data.choices[0].message.content;

        // 2. Get Voice (ElevenLabs)
        const voiceResponse = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`, {
            text: aiText,
            voice_settings: { stability: 0.75, similarity_boost: 0.75 }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            responseType: 'arraybuffer'
        });

        const voiceAudioBase64 = Buffer.from(voiceResponse.data).toString('base64');

        // 3. Get Video (D-ID)
        const didResponse = await axios.post('https://api.d-id.com/talks', {
            script: { type: 'text', input: aiText, provider: { type: 'elevenlabs', voice_id: 'EXAVITQu4vr4xnSDxMaL' } },
            source_url: 'https://create-images-results.d-id.com/DefaultAvatar.jpg' // You can replace with custom avatar
        }, {
            headers: {
                Authorization: `Basic ${DID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const videoUrl = didResponse.data.result_url;

        res.json({ aiText, voiceAudioBase64, videoUrl });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send('Something went wrong with Salma.');
    }
});

app.get('/', (req, res) => {
    res.send('Salma AI Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Salma server running on port ${PORT}`));
