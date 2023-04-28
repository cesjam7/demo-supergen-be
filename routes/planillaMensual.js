const express = require('express');
const router = express.Router();
const planillaMensualModelo = require('../models/planillaMensual');
const auth = require('../middlewares/auth')



router.post("/resumen", auth.isAuth, async function (req, res) {
    try {
        const data = await planillaMensualModelo.resumen(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportarExcel", auth.isAuth, async function (req, res) {
    try {
        const data = await planillaMensualModelo.exportarExcel(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})



module.exports = router