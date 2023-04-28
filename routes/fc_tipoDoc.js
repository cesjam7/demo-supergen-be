const express = require('express');
const router = express.Router();
const fcTipoDocumentoModelo = require('../models/fc_tipoDoc');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcTipoDocumentoModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    try {
        await fcTipoDocumentoModelo.guardar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/editar", async function (req, res) {
    await fcTipoDocumentoModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
module.exports = router