const express = require('express')
const app = express()

app.use(express.json());

const port = 3000

app.post("/pre-approve", (req, res) => {
    res.send({
        approved: true
    })
})

app.listen(port, () => {
  console.log(`Mediator API listening on port ${port}`)
})
