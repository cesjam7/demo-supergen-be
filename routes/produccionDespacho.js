var express = require('express');
var router = express.Router();
var produccionDespacho = require('../models/produccionDespacho');
const auth = require('../middlewares/auth')

router.get("/despacho", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.getStockHI();
    res.json(respuesta)
})

router.get("/venta", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.getStockHC();
    res.json(respuesta)
})

router.get("/pf/:id", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.getPF(req.params.id);
    res.json(respuesta)
})

router.post("/pf", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.updateHuevos(req.body);
    res.json(respuesta)
})

router.post("/despacho", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.updateStockHI(req.body);
    res.json(respuesta)
})

router.post("/venta", auth.isAuth, async function(req, res, next) {
    let respuesta = await produccionDespacho.updateStockHC(req.body);
    res.json(respuesta)
})

module.exports=router;