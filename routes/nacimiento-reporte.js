var express = require('express');
var router = express.Router();
var nacimiento_reporte = require('../models/nacimiento-reporte');
const auth = require('../middlewares/auth');

router.get('/ultimo-registro', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.selectMaxId();
    if (rows[0].maxId == null) {
        res.json(1);
    } else {
        res.json(rows[0].maxId + 1);
    }
})

router.get('/cargas', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.getAllCargos();
    res.json(rows);
})

router.post('/', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.addNacimientoReporte(req.body);
    res.json(rows);
})

router.get('/nacimiento_reportedet/:idLote', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.getNacimientoById(req.params.idLote);
    res.json(rows);
})

router.get('/nacimiento-reporte-det/:idNacimientoReporte', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.getNacimientosReportesById(req.params.idNacimientoReporte);
    res.json(rows);
})

router.get('/', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.getAllNacimientosReportes();
    res.json(rows);
})
router.delete('/:id', auth.isAuth, async function(req, res, next) {
    let rows = await nacimiento_reporte.deleteNacimientosReportesById(req.params.id);
    res.json(rows);
})

module.exports = router;