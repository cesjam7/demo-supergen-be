var express = require('express');
var router = express.Router();
var mortalidadDiariaF33 = require('../models/mortalidadDiariaF33');
const auth = require('../middlewares/auth')
const periodoF33Model = require("../models/periodo_f33");
var sendEmailModel = require('../models/sendEmail');
var moment = require('moment')

router.post("/Agregar", auth.isAuth, async function (req, res, next) {
    req.body.user = req.user;
    let rows = await mortalidadDiariaF33.Agregar(req.body);
    res.json(rows);
})
router.get("/Cron", auth.isAuth, async function (req, res, next) {
    console.log("cron diario de mortalidad");
    var respuesta = await periodoF33Model.cronDiario();
    await sendEmailModel.sendEmail(
        "Reporte de mortalidad de periodos abiertos ",
        ["cibanezpe@gmail.com"],
        //, "lbuttgenbach@supergen.net"],
        '<p>Se a generado el reporte de mortalidad diaria de los periodos abiertos </p>',
        '"Supergen SA" <infosupergen@gmail.com>'
    )
    res.json(respuesta);
})



router.post("/Lotes", auth.isAuth, async function (req, res, next) {
    let rows = await mortalidadDiariaF33.getLotes(req.body);
    res.json(rows);
})
router.post("/saldoInicialMortalidadDiariaPorFechaYLotes", auth.isAuth, async function (req, res) {
    try {
        let saldoInicial = await mortalidadDiariaF33.saldoInicialMortalidadDiariaPorFechaYLotes(req.body);
        res.json(saldoInicial);
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/getCartilla", auth.isAuth, async function (req, res, next) {
    let rows = await mortalidadDiariaF33.getCartilla(req.body);
    res.json(rows);
})


router.post("/ExportExcel", auth.isAuth, async function (req, res, next) {
    let rows = []
    if (req.body.TipoCartilla.title == "Mortalidad") {
        rows = await mortalidadDiariaF33.ExportExcelMortalidad(req.body)
    }

    if (rows.success == true) {
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.json(rows)
    } else {
        res.json({
            success: false,
            message: "Ocurrió un error en el servidor."
        })
    }
})
module.exports = router;