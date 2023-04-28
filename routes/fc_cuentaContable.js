const express = require('express');
const router = express.Router();
const fcCuentaContable = require('../models/fc_cuentaContable');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcCuentaContable.listar()
    res.send(lista)
})
router.get('/listarCuentas', async function (req, res) {
    const lista = await fcCuentaContable.listarCuentas()
    res.send(lista)
})
router.get('/listarCuentaPorTipoServicio/:idTipoServicio', async function (req, res) {
    const lista = await fcCuentaContable.listarPorTipoServicio(req.params.idTipoServicio)
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await fcCuentaContable.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", async function (req, res) {
    try {
        await fcCuentaContable.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
module.exports = router