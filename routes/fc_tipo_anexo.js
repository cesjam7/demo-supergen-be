const express = require('express');
const router = express.Router();
const fcTipoAnexoModelo = require('../models/fc_tipoAnexo');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcTipoAnexoModelo.listar()
    res.send(lista)
})

router.post("/", async function (req, res) {
    try {
        await fcTipoAnexoModelo.guardar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/proveedores", async function (req, res) {
    try {
        const lista = await fcTipoAnexoModelo.listarProveedoresPorTipoAnexo(req.body)
        res.send(lista)
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/editar", async function (req, res) {
    await fcTipoAnexoModelo.editar(req.body)
    res.send({ message: "exitoso" })
})
router.delete("/:objetoId", async function (req, res) {
    await fcTipoAnexoModelo.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router