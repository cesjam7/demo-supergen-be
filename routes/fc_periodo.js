const express = require('express');
const router = express.Router();
const fcPeriodoModelo = require('../models/fc_periodo');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcPeriodoModelo.listar()
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await fcPeriodoModelo.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", async function (req, res) {
    await fcPeriodoModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
module.exports = router