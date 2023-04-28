const express = require('express');
const router = express.Router();
var alimentacionCosteoRModelo = require('../models/alimentacionCosteo');
const auth = require('../middlewares/auth');

router.post("/consultarMovilidad", async (req, res) => {
    try {
        const data = await alimentacionCosteoRModelo.consultarMovilidad(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/consultarTareo", async (req, res) => {
    try {
        const data = await alimentacionCosteoRModelo.consultarTareo(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/consultarAlimentacion", async (req, res) => {
    try {
        const data = await alimentacionCosteoRModelo.consultarAlimentacion(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportarExcel", async (req, res) => {
    try {
        const data = await alimentacionCosteoRModelo.exportExcel(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})


module.exports = router;