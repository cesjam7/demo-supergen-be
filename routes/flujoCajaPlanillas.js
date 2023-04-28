const express = require('express');
const router = express.Router();
const flujoCajaPlanillasModelo = require('../models/flujoCajaPlanillas');
const auth = require('../middlewares/auth')

router.post('/consultarMensual', async function (req, res) {
    const lista = await flujoCajaPlanillasModelo.consultarResumenMensual(req.body);
    res.send(lista)
})
router.post('/consultarGeneral', async function (req, res) {
    const lista = await flujoCajaPlanillasModelo.consultarResumenGeneral(req.body);
    res.send(lista)
})
router.post('/exportarMensual', async function (req, res) {
    const data = await flujoCajaPlanillasModelo.exportarResumenMensual(req.body);
    res.send(data)
})
router.post('/exportarGeneral', async function (req, res) {
    const data = await flujoCajaPlanillasModelo.exportarResumenGeneral(req.body);
    res.send(data)
})


module.exports = router