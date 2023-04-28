const express = require('express');
const router = express.Router();
const provisionCosteo = require('../models/provisionCosteo');
const auth = require('../middlewares/auth')



router.post("/verificar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCosteo.verificarInformacion(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/procesar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCosteo.procesar(req.body, req.user)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/consultar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCosteo.consultar(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCosteo.exportExcel(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

module.exports = router