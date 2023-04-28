const express = require('express');
const router = express.Router();
const provisionCierre = require('../models/provisionCierre');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await provisionCierre.listar()
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await provisionCierre.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", async function (req, res) {
    await provisionCierre.editar(req.body)
    res.send({ message: "exitoso" })
})
module.exports = router