const { GoogleGenAI } = require('@google/genai')
const express = require('express')
const app = express()

app.use(express.json());

const port = 3000

const clientAI = new GoogleGenAI({apiKey: "AIzaSyBu9bv1zNeqHe-fhtV_8hZjqGiCmP75Cb0"});

app.post("/pre-approve", async (req, res) => {
    const { ideaDescription } = req.body

    const prompt = `Analise se a ideia a seguir é possivel de ser programada: 
    Reponda apenas
    1) APROVADO ou REPROVADO
    ${ideaDescription}`

    const response = await clientAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    // const approved = response.includes("APROVADO")

    res.send({
        approved: response
    })
})

app.listen(port, () => {
    console.log(`Mediator API listening on port ${port}`)
})
