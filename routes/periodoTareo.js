let express = require('express');
let router = express.Router();
let periodoTareo = require('../models/periodoTareo');

router.get('/', async (req, res, next) => {
    let respuesta = await periodoTareo.getAllPeriodos();
    res.json(respuesta)
})

router.get('/ByPeriodo/:periodoTareo', async (req, res, next) => {
    let respuesta = await periodoTareo.getPeriodosByPeriodo(req.params.periodoTareo);
    res.json(respuesta)
})

router.get('/getPeriodosEstado1', async (req, res, next) => {
    let respuesta = await periodoTareo.getPeriodosEstado1();
    res.json(respuesta)
})

router.post('/', async (req, res, next) => {
    let respuesta = await periodoTareo.addPeriodo(req.body);
    res.json(respuesta)
})

router.get('/sockaves', async (req, res, next) => {
    let respuesta = await periodoTareo.Getperiodo();
    res.json(respuesta);
})

router.post('/desactivatePeriodos', async (req, res, next) => {
    let respuesta = await periodoTareo.desactivatePeriodos(req.body);
    res.json(respuesta)
})
router.post('/activarPeriodo', async (req, res, next) => {
    await periodoTareo.activarPeriodo(req.body);
    res.json({ message: "Exitoso" })
})

module.exports = router;