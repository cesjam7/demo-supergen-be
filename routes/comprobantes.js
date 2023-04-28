const express = require('express')
const router = express.Router()
const comprobantes = require('../models/comprobantes');
const auth = require('../middlewares/auth')

router.get('/comprobantes/:series', async (req, res, next) => {
    let rows = await comprobantes.getAllcomprobantes(req.params.series);
    res.json(rows);
})
router.get('/items', async (req, res, next) => {
    let rows = await comprobantes.getAllitems();
    res.json(rows);
})
router.get("/items/:almacen/:tipodoc/:numdoc", async (req, res, next) => {
    let rows = await comprobantes.getItemsFilters(req.params.almacen, req.params.tipodoc, req.params.numdoc);
    res.json(rows);
})
router.post("/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        res.send(await comprobantes.exportarExcel(req.body))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/series', auth.isAuth, function (req, res, next) {
    comprobantes.getAllseries(function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/guardarComprobante/:calma/:ctd/:numdoc', async (req, res, next) => {
    try {
        var cosa = await comprobantes.guardarComprobante(req.params.calma, req.params.ctd, req.params.numdoc)
        res.json({ message: "Se insertó correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/series/registro/:serie/:unidad/:senasa', auth.isAuth, function (req, res, next) {
    comprobantes.agregarSerie(req.params.serie, req.params.unidad, req.params.senasa, function (err, count) {
        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
})
router.get('/series/editar/:id/:serie/:unidad/:senasa', auth.isAuth, function (req, res, next) {
    comprobantes.editarSerie(req.params.id, req.params.serie, req.params.unidad, req.params.senasa, function (err, count) {
        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
})
router.get('/series-usuarios/', auth.isAuth, function (req, res, next) {
    comprobantes.getSeriesUsuarios(function (err, rows) {
        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);//or return count for 1 & 0
        }
    });
})
router.post('/series-usuarios/', auth.isAuth, function (req, res, next) {
    comprobantes.seriesUsuarios(req.body.serie_id, req.body.usuarios, function (err, count) {
        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
})
router.post('/validacion/', auth.isAuth, function (req, res, next) {
    comprobantes.validacion(req.body.codigos_para_validar, function (err, count) {
        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
})


module.exports = router