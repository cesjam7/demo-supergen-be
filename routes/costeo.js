let express = require('express');
let router = express.Router();
let costeo = require('../models/costeo');
const auth = require('../middlewares/auth')

router.get('/getPeriodos', auth.isAuth, async (req, res, next) => {
    let respuesta = await costeo.getAllPeriodos();
    res.json(respuesta)
})

router.post('/desactivatePeriodos', auth.isAuth, async (req, res, next) => {
    let respuesta = await costeo.desactivatePeriodos(req.body);
    res.json(respuesta)
})
router.post('/activar', auth.isAuth, async (req, res, next) => {
    await costeo.activar(req.body);
    res.json({ message: "exitoso" })
})
router.post("")
router.get("/getLotesByPeriodo/:Periodo", auth.isAuth, async (req, res, next) => {
    let resp = await costeo.getLotesByPeriodo(req.params.Periodo);
    res.json(resp);
})

router.post('/getData', auth.isAuth, async (req, res, next) => {
    let rows = await costeo.getData(req.body);
    res.json(rows);
})

router.post('/consultas/getMyD', auth.isAuth, async (req, res, next) => {
    let rows = await costeo.getMyD(req.body);
    res.json(rows);
})

module.exports = router;