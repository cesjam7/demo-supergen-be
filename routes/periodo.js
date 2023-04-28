let express = require('express');
let router = express.Router();
let periodo = require('../models/periodo');

router.get('/',async (req,res,next) => {
    let respuesta = await periodo.getAllPeriodos();
    res.json(respuesta)
})

router.get('/ByPeriodo/:periodo',async (req,res,next) => {
    let respuesta = await periodo.getPeriodosByPeriodo(req.params.periodo);
    res.json(respuesta)
})

router.get('/getPeriodosEstado1',async (req,res,next) => {
    let respuesta = await periodo.getPeriodosEstado1();
    res.json(respuesta)
})

router.post('/',async (req,res,next) => {
    let respuesta = await periodo.addPeriodo(req.body);
    res.json(respuesta)
})


router.get('/sockaves', async (req,res,next) => {
let respuesta = await periodo.Getperiodo();
res.json(respuesta);
})

module.exports=router;