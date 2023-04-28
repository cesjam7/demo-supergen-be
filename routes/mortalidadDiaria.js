var express = require('express');
var router = express.Router();
var mortalidadDiaria = require('../models/mortalidadDiaria');
const auth = require('../middlewares/auth')

router.post("/Lotes", auth.isAuth, async function (req, res, next) {
    let rows = await mortalidadDiaria.getLotes(req.body);
    res.json(rows);
})
router.post("/getCartilla", auth.isAuth, async function (req, res, next) {
    let rows = await mortalidadDiaria.getCartilla(req.body);
    res.json(rows);
})
module.exports = router;