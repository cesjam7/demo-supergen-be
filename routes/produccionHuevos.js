var express = require('express');
var router = express.Router();
var produccionHuevos = require('../models/produccionHuevos');
const auth = require('../middlewares/auth')
var mortalidad1 = require('../models/produccionMortalidad');

router.get('/getAllHuevosLotes/:idProduccion', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getAllHuevosLotes(req.params.idProduccion);
    res.json(rows);
})

router.get('/getPorcentajeHuevosIncubables/:idProduccion', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosIncubablesPorLote(req.params.idProduccion);
    res.json(rows);
})
router.get('/getPorcentajeHuevosRotos/:idProduccion', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosRotos(req.params.idProduccion);
    res.json(rows);
})
router.get('/getPorcentajeDobleYema/:idProduccion', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosDobleYema(req.params.idProduccion);
    res.json(rows);
})

router.get('/getAllHuevosLotes/:idProduccion', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getAllHuevosLotes(req.params.idProduccion);
    res.json(rows);
})
router.post('/getHuevosSemana/grupal', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.postHuevosSemana(req.body);
    res.json(rows);
})
router.post('/porcentajeHuevosIncubables/grupal', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosIncubablesPorLotes(req.body);
    res.json(rows);
})
router.post('/porcentajeHuevosDobleYema/grupal', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosDobleYemaPorLotes(req.body);
    res.json(rows);
})
router.post('/porcentajeHuevosRotos/grupal', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getPorcentajeHuevosRotosPorLotes(req.body);
    res.json(rows);
})
router.post("/produccionHuevosDiarios/total", async function (req, res, next) {
    const rows = await produccionHuevos.getProduccionDiaria(req.body.produccionId, req.body.periodo)
    res.send(rows)
})
router.post("/produccionHuevosDiariosApp/total", async function (req, res) {
    const rows = await produccionHuevos.getProduccionDiariaAppProduccion(req.body)
    res.send(rows)
})
router.get('/getHuevosSemana/:idLote', auth.isAuth, function (req, res, next) {
    produccionHuevos.getHuevosSemana(req.params.idLote, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    })
})
router.get('/dia/:idProduccion/:idLote/:edad', auth.isAuth, function (req, res, next) {
    console.log('params', req.params);
    produccionHuevos.getmortalidadDia(req.params.idProduccion, req.params.idLote, req.params.edad, function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.get('/produccion/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getMortalidadProduccion(req.params.id);
    res.json(rows);
})
router.get('/ultimo-dia/:id?', auth.isAuth, function (req, res, next) {
    produccionHuevos.getHuevosUltimoDia(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows[0]);
        }
    });
})
router.post('/modal/', auth.isAuth, async function (req, res, next) {
    let count = await mortalidad1.verifyMortalidadEdad(req.body);
    if (count.length == 0) {
        res.json({
            "message": "Primero registre Datos en Mortalidad",
            "success": false
        })
    } else {
        let rows = await produccionHuevos.addHuevosModal(req.body);
        let rows2 = await produccionHuevos.updateHuevosModalSem(req.body);
        let rows3 = await produccionHuevos.updateHuevosModalSemSTD(req.body);
        let rows4 = await produccionHuevos.ProcedureHuevos(req.body);
        res.json(rows3);
    }
});
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.updateHuevos(req.params.id, req.body);
    let rows2 = await produccionHuevos.updateHuevosModalSem(req.body);
    let rows3 = await produccionHuevos.updateHuevosModalSemSTD(req.body);
    let rows4 = await produccionHuevos.ProcedureHuevos(req.body);
    res.json(rows3);
});
router.get('/getStandardHembra', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getStandardHembra();
    res.json(rows);
})
router.get('/getStandardMacho', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getStandardMacho();
    res.json(rows);
})
// router.post('/cocina/:id', auth.isAuth,async function(req,res,next){
//     let rows = await produccionHuevos.cocina(req.params.id);
//     res.json(rows);
// });
router.get('/huevosjson/:id?', auth.isAuth, function (req, res, next) {
    produccionHuevos.getHuevosByIdLote(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
})
router.get('/huevosjsonSem/:id', auth.isAuth, function (req, res, next) {
    produccionHuevos.getHuevosByIdLoteSem(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    })
})
router.get('/huevosjsonprodSem/:semana/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await produccionHuevos.getHuevosByIdProduccionSem(req.params.semana, req.params.idLote);
    res.json(rows);
})

router.post('/SalidasHC', auth.isAuth, async (req, res, next) => {
    let rows = await produccionHuevos.SalidasHC(req.body);
    res.json(rows);
})

router.get('/Cron', async (req, res, next) => {
    var respuesta = await produccionHuevos.getProduccionDiariaCron();
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
module.exports = router;