const express = require('express');
const router = express.Router();
const fcTipoServicioModelo = require('../models/fc_tipoServicio');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcTipoServicioModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    await fcTipoServicioModelo.guardar(req.body)
    res.send({ message: "exitoso" })
})

router.post("/editar", async function (req, res) {
    await fcTipoServicioModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
router.delete("/:objetoId", async function (req, res) {
    await fcTipoServicioModelo.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router