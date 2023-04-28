var express = require('express');
var router = express.Router();
var enfermedades = require('../models/enfermedades');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await enfermedades.getAllenfermedades();
    res.json(rows);
});

router.get('/enfermedad/:id?', async function (req, res, next) {

    let rows2 = await enfermedades.getEnfermedadesById(req.params.id);
    res.json(rows2);
});

router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await enfermedades.addEnfermedad(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {

    let rows4 = await enfermedades.updateEnfermedad(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {

    let rows5 = await enfermedades.deleteEnfermedad(req.params.id);
    res.json(rows5);
});
module.exports = router;