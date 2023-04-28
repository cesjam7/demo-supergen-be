var express = require('express');
var router = express.Router();
var laboratorios = require('../models/laboratorios');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await laboratorios.getAllLaboratorios();
    res.json(rows);
});
router.get('/laboratorio/:id?', async function (req, res, next) {

    let rows2 = await laboratorios.getlaboratorioById(req.params.id);
    res.json(rows2);
});
router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await laboratorios.addLaboratorio(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {

    let rows4 = await laboratorios.updateLaboratorio(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {

    let rows5 = await laboratorios.deleteLaboratorio(req.params.id);
    res.json(rows5);
});
module.exports = router;