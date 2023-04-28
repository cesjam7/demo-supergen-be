let express = require('express');
let router = express.Router();
let periodoF33 = require('../models/periodo_f33');
const auth = require('../middlewares/auth');
var sendEmailModel = require('../models/sendEmail');
var moment = require('moment')

router.get('/',async (req,res,next) => {
    let respuesta = await periodoF33.getAllPeriodos();
    res.json(respuesta)
})

router.get('/ByPeriodo/:periodoF33',async (req,res,next) => {
    let respuesta = await periodoF33.getPeriodosByPeriodo(req.params.periodoF33);
    res.json(respuesta)
})

router.get('/getPeriodosEstado1',async (req,res,next) => {
    let respuesta = await periodoF33.getPeriodosEstado1();
    res.json(respuesta)
})

router.post('/', auth.isAuth, async (req,res,next) => {
    console.log('user',req.user);
    //return;
    req.body.user = req.user;
    let respuesta = await periodoF33.addPeriodo(req.body);
    res.json(respuesta)
})

router.get('/sockaves', async (req,res,next) => {
    let respuesta = await periodoF33.Getperiodo();
    res.json(respuesta);
})

router.post('/desactivatePeriodos',async (req,res,next) => {
    let respuesta = await periodoF33.desactivatePeriodos(req.body);
    res.json(respuesta)
})

router.get('/crondiario', async (req,res,next) => {
    var respuesta = await periodoF33.cronDiarioAlimentos();
    /*var email = await sendEmailModel.sendEmail(
        "Reporte de mortalidad de periodos abiertos " + respuesta.periodos_ini + " - " + respuesta.periodos_ini,
        ["jorge.hospinal@yahoo.com", "cibanezpe@gmail.com"],
        //, "lbuttgenbach@supergen.net"],
        '<p>Se a generado el reporte de mortalidad diaria de los periodos abiertos '+moment(respuesta.log.fechahora).format("DD-MM-YYYY hh:mm")+'</p>',
        '"Supergen SA" <infosupergen@gmail.com>'
    )
    respuesta.email = email;*/
    res.json(respuesta);
})

module.exports=router;