const express = require('express');
const router = express.Router();
const fcFlujoProyectado = require('../models/fc_proyectado');
const auth = require('../middlewares/auth')
const upload = require('../config/multerXmlFileStorageConfig')
router.get('/', async function (req, res) {

    const lista = await fcFlujoProyectado.listar()
    res.send(lista)
})
router.get('/detalles/:idCabecera', async function (req, res) {

    const lista = await fcFlujoProyectado.listarDetallePorCabecera(req.params.idCabecera)
    res.send(lista)
})
router.get('/exportacion/:idCabecera', async function (req, res) {
    const url = await fcFlujoProyectado.exportarExcel(req.params.idCabecera)
    res.send(url)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await fcFlujoProyectado.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/actualizarTipoServicioFamiliaYSubFamilia", auth.isAuth, async function (req, res) {
    try {
        await fcFlujoProyectado.actualizarTipoServicioFamiliaYSubFamilia(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/importar", auth.isAuth, upload.single("file"), async function (req, res) {
    try {
        const data = await fcFlujoProyectado.importar(req.file.path)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/tipoCambioPorPeriodo", auth.isAuth, async function (req, res) {
    try {
        const valor = await fcFlujoProyectado.tipoCambioPorFecha(req.body.periodo)
        res.send({ valor })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/editar", async function (req, res) {
    await fcFlujoProyectado.editar(req.body)
    res.send({ message: "exitoso" })
})
module.exports = router