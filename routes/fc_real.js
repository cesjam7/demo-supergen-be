const express = require('express');
const router = express.Router();
const flujoReal = require('../models/fc_real');
const auth = require('../middlewares/auth')
const upload = require('../config/multerXmlFileStorageConfig')
router.post('/', async function (req, res) {

    const lista = await flujoReal.listar(req.body)
    res.send(lista)
})
router.get('/detalles/:idCabecera', async function (req, res) {

    const lista = await flujoReal.listarDetallePorCabecera(req.params.idCabecera)
    res.send(lista)
})
router.get('/exportacion/:idCabecera', async function (req, res) {
    const url = await flujoReal.exportarExcel(req.params.idCabecera)
    res.send(url)
})

router.post("/guardar", auth.isAuth, async function (req, res) {
    try {
        await flujoReal.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/actualizarTipoServicioFamiliaYSubFamilia", auth.isAuth, async function (req, res) {
    try {
        await flujoReal.actualizarTipoServicioFamiliaYSubFamilia(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/importarConcar", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoReal.importarConcar(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/importar", auth.isAuth, upload.single("file"), async function (req, res) {
    try {
        const data = await flujoReal.importar(req.file.path)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/tipoCambioPorPeriodo", auth.isAuth, async function (req, res) {
    try {
        const valor = await flujoReal.tipoCambioPorFecha(req.body.periodo)
        res.send({ valor })
    } catch (error) {
        res.status(500).send(error.message)
    }

})

module.exports = router