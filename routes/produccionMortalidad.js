var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth')
var produccionMortalidad = require('../models/produccionMortalidad');

router.get('/:id?', auth.isAuth, async function (req, res, next) {
    if (req.params.id == "producciones") {
        produccionMortalidad.getMortalidadProducciones(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else {
        let rows = await produccionMortalidad.getAllAcumlotes(req.params.id)
        res.json(rows);
    }
})

router.post("/uniformidadPorLotes", async function (req, res) {
    const data = await produccionMortalidad.uniformidadPorLotes(req.body)
    res.send(data)
})

router.get("/uniformidadPorProduccion/:idProduccion", async function (req, res) {
    const data = await produccionMortalidad.uniformidadPorIdProduccion(req.params.idProduccion)
    res.send(data)
})
router.get('/produccion/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await produccionMortalidad.getLotesProduccion(req.params.id);
    res.json(rows);
})
router.get('/semana/:id?', auth.isAuth, function (req, res, next) {
    produccionMortalidad.getMortalidadSemana(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/mortalidades/:id?', auth.isAuth, function (req, res, next) {
    produccionMortalidad.getMortalidadByIdLevante(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/ultimo-dia/:id?', auth.isAuth, function (req, res, next) {
    produccionMortalidad.getmortalidadUltimoDia(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})

router.post("/mortalidad/verificarMortalidad", auth.isAuth, async (req, res) => {
    try {
        const data = await produccionMortalidad.verificarMortalidadesPorEdades(req.body)
        res.send(data);
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get('/dia/:idlevante/:edad', auth.isAuth, function (req, res, next) {
    produccionMortalidad.getmortalidadDia(req.params.idlevante, req.params.edad, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.get('/semana/:idlevante/:semana/:fecha', auth.isAuth, async function (req, res, next) {
    let rows = await produccionMortalidad.getmortalidadSemana(req.params);
    res.json(rows);
})
router.post('/modal/', auth.isAuth, async function (req, res, next) {
    let resp = await produccionMortalidad.StockMensualAves(req.body);
    if (resp.success == false) {
        res.json(resp);
    } else {
        let rr = await produccionMortalidad.addMortalidadModal(req.body);
        let rows = await produccionMortalidad.addMortalidadModal2(req.body, rr);
        let count2 = await produccionMortalidad.updateAcumulado2(req.body);
        await produccionMortalidad.StockMensualAves(req.body);
        await produccionMortalidad.verifyVentas(req.body);
        res.json({
            success: true,
            rows: rows
        });
    }
})
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let resp = await produccionMortalidad.StockMensualAves(req.body);
    if (resp.success == false) {
        res.json(resp);
    } else {
        let rows = await produccionMortalidad.updateMortalidad(req.params.id, req.body);
        let count = await produccionMortalidad.updateValores(req.body);
        let count1 = await produccionMortalidad.updateAcumulado(req.body);
        let count2 = await produccionMortalidad.updateAcumulado2(req.body);
        let count3 = await produccionMortalidad.disparadorAlimentos(req.body);
        let count4 = await produccionMortalidad.addMortalidadModal2(req.body);
        await produccionMortalidad.StockMensualAves(req.body);
        await produccionMortalidad.verifyVentas(req.body);
        res.json(req.body);
    }
});
router.post('/verifyPeriodo', auth.isAuth, async function (req, res, next) {
    let resp = await produccionMortalidad.verifyPeriodo(req.body);
    res.json(resp);
});

module.exports = router;
