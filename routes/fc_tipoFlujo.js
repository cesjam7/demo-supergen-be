const express = require('express');
const router = express.Router();
const fcTipoFlujoModelo = require('../models/fc_tipoFlujo');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcTipoFlujoModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    await fcTipoFlujoModelo.guardar(req.body)
    res.send({ message: "exitoso" })
})

router.post("/editar", async function (req, res) {
    await fcTipoFlujoModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
router.delete("/:objetoId", async function (req, res) {
    await fcTipoFlujoModelo.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router