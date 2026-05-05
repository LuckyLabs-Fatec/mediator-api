"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const port = 3000;
const apiKey = process.env.API_KEY_GOOGLEGENAI;
if (!apiKey) {
    throw new Error('API_KEY_GOOGLEGENAI não definida no ambiente.');
}
const clientAI = new genai_1.GoogleGenAI({ apiKey });
app.post('/pre-approve', async (req, res) => {
    try {
        const { ideaDescription } = req.body;
        if (!ideaDescription || !ideaDescription.trim()) {
            return res.status(400).send({
                error: 'ideaDescription é obrigatória.'
            });
        }
        const prompt = `Analise se a ideia a seguir é possível de ser programada:
Responda apenas
1) APROVADO ou REPROVADO
${ideaDescription}`;
        const response = await clientAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const approved = response.text?.toUpperCase().includes('APROVADO') ?? false;
        return res.send({ approved });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Erro ao processar pré-aprovação.' });
    }
});
app.listen(port, () => {
    console.log(`Mediator API listening on port ${port}`);
});
