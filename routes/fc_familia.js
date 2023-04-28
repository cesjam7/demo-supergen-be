const express = require('express');
const router = express.Router();
const fcFamiliaModelo = require('../models/fc_familia');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcFamiliaModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    try {
        await fcFamiliaModelo.guardar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/editar", async function (req, res) {
    await fcFamiliaModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
router.delete("/:objetoId", async function (req, res) {
    await fcFamiliaModelo.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router