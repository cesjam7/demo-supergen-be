const express = require('express')
const router = express.Router()
const DBCostsSG = require('../models/DBCostsSG');
const auth = require('../middlewares/auth');
/* const errors = require('../middlewares/error.handler'); */

router.post('/', auth.isAuth, async (req, res, next) => {
    let rows = await DBCostsSG.executeSP(req.body);
    let rows2 = await DBCostsSG.addCostos(req.body, rows);
    res.json(rows2);
})
router.get("/:articleId/getFamilyAndUnitMeasurement", [auth.isAuth], async (req, res) => {
    console.log("article id", req.params.articleId)
    try {
        const rows = await DBCostsSG.getFamilyAndMeasurementFindProduct(req.params.articleId);
        res.json(rows)
    } catch (err) {
        console.log("error", err)
        res.status(500).send(err)
    }
})
router.get("/getProvidersContab", auth.isAuth, async (req, res) => {
    try {
        const rows = await DBCostsSG.getProvidersContab();
        res.json(rows)
    } catch (err) {
        console.log("error", err)
        res.status(500).send(err)
    }
})
router.post('/getData', auth.isAuth, async (req, res, next) => {
    let rows = await DBCostsSG.getData(req.body);
    res.json(rows);
})
router.post("/reporteVenta", async (req, res) => {
    try {
        const rows = await DBCostsSG.traerReporteVenta(req.body);
        res.json(rows);
    } catch (error) {
        res.status(500).send(error)
    }
})
router.delete('/:hoja/:Periodo', async (req, res, next) => {
    let rows = await DBCostsSG.deleteData(req.params);
    res.json(rows);
})

router.post('/clientes/RS', auth.isAuth, async (req, res, next) => {
    let rows = await DBCostsSG.getClientes();
    let rows2 = await DBCostsSG.addClientes(req.body, rows);
    res.json(rows2);
})

router.post('/clientes/SG', auth.isAuth, async (req, res, next) => {
    let rows = await DBCostsSG.getClientesSG(req.body);
    res.json(rows);
})

router.delete('/EL', async (req, res, next) => {
    let rows = await DBCostsSG.DeleteClientesSG(req.params);
    res.json(rows);
})

router.get("/getArticles", async (req, res) => {
    let rows = await DBCostsSG.getArticles(req.query.type);
    res.json(rows);


});
router.get("/getArticlesActualizado", async (req, res) => {
    let rows = await DBCostsSG.getArticlesActualizado();
    res.json(rows);

});

router.get("/getProviders", async (req, res, next) => {
    let rows = await DBCostsSG.getProviders();
    res.json(rows);
})

router.post("/getCompras", async (req, res, next) => {
    let rows = await DBCostsSG.getCompras(req.body);
    res.json(rows);
})

router.post("/consultas/granja", async (req, res, next) => {
    let rows = await DBCostsSG.consGranja(req.body);
    res.json(rows);
})

router.post("/consultas/planta", async (req, res, next) => {
    let rows = await DBCostsSG.consPlanta(req.body);
    res.json(rows);
})
router.post("/generarExcelVenta", async (req, res) => {
    try {
        const rows = await DBCostsSG.generarExcelVenta(req.body.params, req.body.rows)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/saveCartilla", async (req, res, next) => {
    let rows = await DBCostsSG.saveCartilla(req.body);
    res.json(rows);
})


module.exports = router