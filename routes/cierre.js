let express = require('express');
let router = express.Router();
let cierre = require('../models/cierre.js');

//rutas para Levante
router.get("/getCierres",async (req,res,next) => {
    let rows = await cierre.getCierres();
    res.json(rows);
})

router.post("/verifyUpdate", async (req,res,next) => {
    let rows = await cierre.VerifyUpdates(req.body);
    res.json(rows);
})

router.get("/getMortalidadesAbiertas",async (req,res,next) => {
    let rows = await cierre.getMortalidadAbiertas();
    res.json(rows);
})

router.post('/CerrarSemanaLev', async (req, res, next) => {
    let rows = await cierre.CerrarSemanasLev(req.body);
    res.json(rows);
})
router.post('/AperturarSemanaLev', async (req, res, next) => {
    let rows = await cierre.AperturarSemanaLev(req.body);
    res.json(rows);
})

router.post('/VistoBuenoGranjaLev', async (req, res, next) => {
    let rows = await cierre.VistoBuenoGranjaLev(req.body);
    res.json(rows);
})
router.post('/VistoBuenoCalidadLev', async (req, res, next) => {
    let rows = await cierre.VistoBuenoCalidadLev(req.body);
    res.json(rows);
})

//Rutas para Produccion
router.get("/getCierresProd",async (req,res,next) => {
    let rows = await cierre.getCierresProd();
    res.json(rows);
})
router.get("/getMortalidadesAbiertasProd",async (req,res,next) => {
    let rows = await cierre.getMortalidadAbiertasProd();
    res.json(rows);
})

router.post('/CerrarSemanaProd', async (req, res, next) => {
    let rows = await cierre.CerrarSemanasProd(req.body);
    res.json(rows);
})
router.post('/AperturarSemanaProd', async (req, res, next) => {
    let rows = await cierre.AperturarSemanaProd(req.body);
    res.json(rows);
})

router.post('/VistoBuenoGranjaProd', async (req, res, next) => {
    let rows = await cierre.VistoBuenoGranjaProd(req.body);
    res.json(rows);
})
router.post('/VistoBuenoCalidadProd', async (req, res, next) => {
    let rows = await cierre.VistoBuenoCalidadProd(req.body);
    res.json(rows);
})


module.exports=router;