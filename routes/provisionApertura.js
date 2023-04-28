const express = require('express');
const router = express.Router();
const provisionApertura = require('../models/provisionApertura');
const auth = require('../middlewares/auth')



router.post("/verificar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionApertura.verificarInformacion(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/procesar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionApertura.procesar(req.body, req.user)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/consultar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionApertura.consultar(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionApertura.exportExcel(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

module.exports = router