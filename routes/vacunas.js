var express = require('express');
var router = express.Router();
var vacunas = require('../models/vacunas');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await vacunas.getAllvacunas();
    res.json(rows);
});
router.get('/vacunas/:id?', async function (req, res, next) {
    let rows2 = await vacunas.getVacunasById(req.params.id);
    res.json(rows2);
});
router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await vacunas.addVacunas(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows4 = await vacunas.updateVacuna(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {
    let rows5 = await vacunas.deleteVacuna(req.params.id);
    res.json(rows5);
});
module.exports = router;