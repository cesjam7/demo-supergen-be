var express = require('express');
var router = express.Router();
var nacimiento = require('../models/nacimiento');
const auth = require('../middlewares/auth');

router.get('/ultimo-registro', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.selectMaxId();
    if (rows[0].maxId == null) {
        res.json(1);
    } else {
        res.json(rows[0].maxId + 1);
    }
})

router.get('/cargas', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.getAllCargos();
    res.json(rows);
})
router.get('/cargosall', auth.isAuth, async function (req, res, next) {
    let rows3 = await nacimiento.getCargosAll();
    res.json(rows3);
})

router.post('/', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.addNacimiento(req.body);
    res.json(rows);
})

router.post('/updatenacimiento', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.updateNacimiento(req.body);
    res.json(rows);
    console.log("rows:", rows);
})

router.get('/nacimientodet/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.getNacimientoById(req.params.idLote);
    res.json(rows);
})

router.get('/nacimientodet-nac/:idNacimiento', async function (req, res, next) {
    let rows = await nacimiento.getNacimientoByIdNac(req.params.idNacimiento);
    res.json(rows);
})

router.get('/nacimientos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.getAllNacimientos();
    res.json(rows);
})

router.get('/Allnacimientos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.getAllNacimientos1();
    res.json(rows);
})
router.post("/graficoHuevosBombaPorLotes", auth.isAuth, async function (req, res) {
    const data = await nacimiento.graficosHuevosBombaDeLotes(req.body)
    res.json(data)
})

router.get('/graficos/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.graficos(req.params.idLote);
    res.json(rows);
})


router.post('/graficos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.graficosAll(req.body.lotes);
    res.json(rows);
})

router.put('/bbsvendacum/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.updatebbsvendacum(req.params.idLote);
    res.json(rows);
})

router.put('/update-sexado-desmedro', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.updateSD(req.body);
    res.json(rows);
})
router.post('/consultas/getnacimientos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.getnacimientos(req.body);
    res.json(rows);
})
router.post('/consultas/req-nacimientos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.reqnacimientos(req.body);
    res.json(rows);
})
router.post('/consultas/reqnacimientosGraficos', auth.isAuth, async function (req, res, next) {
    let rows = await nacimiento.reqnacimientosGraficos();
    res.json(rows);
})
router.post('/consultas-export/req-nacimientos', auth.isAuth, async function (req, res, next) {
    let respuesta = await nacimiento.reqnacimientosexport(req.body);
    if (respuesta.success == true) {
        respuesta.rutaCompletaRA = "/supergen-be" + respuesta.rutaRA
        res.json(respuesta)
    } else {
        res.json({
            success: false,
            message: "Ocurrió un error en el servidor."
        })
    }
});
router.get('/cabecera/:idLote', async function (req, res, next) {
    let rows = await nacimiento.getNacimientoCabeceraById(req.params.idLote);
    res.json(rows);
})

router.get('/poultry/', async function (req, res, next) {
    let rows = await nacimiento.getNacimientoPoultry();
    res.json(rows);
})

router.post('/cerrarNacimiento/', async function (req, res, next) {
    let rows = await nacimiento.cerrarNacimiento(req.body);
    res.json(rows);
})
module.exports = router;