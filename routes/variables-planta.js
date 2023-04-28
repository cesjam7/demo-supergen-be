var express = require('express');
var router = express.Router();
var variablesPlanta = require('../models/variables-planta');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await variablesPlanta.getAllVariablesPlanta();
    res.json(rows);
});
router.get('/variables-planta/:id?', async function (req, res, next) {
    let rows2 = await variablesPlanta.getVariablesPlantaById(req.params.id);
    res.json(rows2);
});
router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await variablesPlanta.addVariablesPlanta(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows4 = await variablesPlanta.updatevariablesPlanta(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {
    let rows5 = await variablesPlanta.deleteVariablesPlanta(req.params.id);
    res.json(rows5);
});
module.exports = router;