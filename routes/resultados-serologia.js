var express = require('express');
var router = express.Router();
var resultadosSerologia = require('../models/resultados-serologia');
const auth = require('../middlewares/auth')

router.get('/getAll', auth.isAuth,async function(req,res,next){
    let rows = await resultadosSerologia.getAllResultadosSerologia();
    res.json(rows);
});

router.get('/getAllLotes', auth.isAuth,async function(req,res,next){
    let rows = await resultadosSerologia.getAllLotesResultadosSerologia();
    res.json(rows);
});

router.get('/:id?', auth.isAuth,async function(req,res,next){
    let rows = await resultadosSerologia.getResultadosSerologiaByid(req.params.id);
    res.json(rows);
});

router.post('/', auth.isAuth, async function(req,res,next){
    let rows = await resultadosSerologia.addResultadoSerologia(req.body);
    res.json(rows);
});

router.post('/detalle', auth.isAuth, async function(req,res,next){
    let rows = await resultadosSerologia.addDetalleResultadoSerologia(req.body);
    res.json(rows);
});

router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows = await resultadosSerologia.updateResultadosSerologia(req.body, req.params.id);
    res.json(rows);
});

router.put('/detalle/:id', auth.isAuth, async function (req, res, next) {
    let rows = await resultadosSerologia.updateResultadosSerologiaDet(req.body, req.params.id);
    res.json(rows);
});

router.delete('/:id', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.deleteResultadosSerologia(req.params.id);
    res.json(rows);
})

router.delete('/detalle/:id', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.deleteResultadosSerologiaDet(req.params.id);
    res.json(rows);
})

router.post('/graficar', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.graficar(req.body);
    res.json(rows);
})

router.post('/graficar-comparativo', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.graficarComparativo(req.body);
    res.json(rows);
})

router.post('/importar', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.importar(req.body);
    res.json(rows);
})

router.post('/eliminar_temp', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.eliminar_temp(req.body);
    res.json(rows);
})

router.post('/registrar_temp', auth.isAuth, async function(req, res, next) {
    let rows = await resultadosSerologia.registrar_temp(req.body);
    res.json(rows);
})
module.exports=router;
