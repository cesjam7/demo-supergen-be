const express = require('express');
const router = express.Router();
const fcSubFamiliaModelo = require('../models/fc_subFamilia');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcSubFamiliaModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    await fcSubFamiliaModelo.guardar(req.body)
    res.send({ message: "exitoso" })
})

router.post("/editar", async function (req, res) {
    await fcSubFamiliaModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
router.delete("/:objetoId", async function (req, res) {
    await fcSubFamiliaModelo.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router