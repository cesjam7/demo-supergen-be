var express = require('express');
var router = express.Router();
var distribuidoras = require('../models/distribuidoras');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await distribuidoras.getAlldistribuidoras();
    res.json(rows);
});
router.get('/distribuidoras/:id?', async function (req, res, next) {

    let rows2 = await distribuidoras.getDistribuidorasById(req.params.id);
    res.json(rows2);
});
router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await distribuidoras.addDistribuidora(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {

    let rows4 = await distribuidoras.updateDistribuidora(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {

    let rows5 = await distribuidoras.deleteDistribuidora(req.params.id);
    res.json(rows5);
});
module.exports = router;