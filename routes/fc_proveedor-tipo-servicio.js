const express = require('express');
const router = express.Router();
const fcProveedorTipoServicio = require('../models/fc_proveedor-tipo-servicio');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res) {

    const lista = await fcProveedorTipoServicio.listar()
    res.send(lista)
})
router.get('/proveedores', async function (req, res) {

    const lista = await fcProveedorTipoServicio.listarProveedores()
    res.send(lista)
})
router.get('/exportarExcel', async function (req, res) {

    const data = await fcProveedorTipoServicio.exportarExcel()
    res.send(data)
})
router.post("/", auth.isAuth, async function (req, res) {
    try {
        await fcProveedorTipoServicio.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/editar", async function (req, res) {
    await fcProveedorTipoServicio.editar(req.body)
    res.send({ message: "exitoso" })
})

router.delete("/:objetoId", async function (req, res) {
    await fcProveedorTipoServicio.eliminar(req.params.objetoId)
    res.send({ message: "exitoso" })
})
module.exports = router