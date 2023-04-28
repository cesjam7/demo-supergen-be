const express = require('express');
const router = express.Router();
const flujoGraficosModelo = require('../models/fc_graficos');
const auth = require('../middlewares/auth')
const upload = require('../config/multerXmlFileStorageConfig')


router.post("/egresos", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.egresoProyeccionReal(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/ingresos", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.ingresosProyeccionReal(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/exportarExcel", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.exportarExcel(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/saldos", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.saldoProyeccionReal(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/flujoEfectivo", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.flujoEfectivo(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.post("/usoEfectivo", auth.isAuth, async function (req, res) {
    try {
        const data = await flujoGraficosModelo.usoEfectivo(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})

module.exports = router