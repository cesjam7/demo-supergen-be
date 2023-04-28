var express = require('express');
var router = express.Router();
var Cartilla = require('../models/Cartilla');
const auth = require('../middlewares/auth')

router.get("/Lotes", auth.isAuth, async function (req, res, next) {
    let rows = await Cartilla.Lotes();
    res.json(rows);
})

router.post("/getCartilla", auth.isAuth, async function (req, res, next) {
    let rows = await Cartilla.getCartilla(req.body);
    res.json(rows);
})

router.post("/ExportExcel", auth.isAuth, async function (req, res, next) {
    let rows = []
    if (req.body.TipoCartilla.title == "Mortalidad") {
        rows = await Cartilla.ExportExcelMortalidad(req.body)
    } else if ((req.body.TipoCartilla.title == "Alimentos")) {
        rows = await Cartilla.ExportExcelAlimentos(req.body.Alimentos, req.body.Rows, req.body.idLevante)
    } else if (req.body.TipoCartilla.title == "PHI") {
        rows = await Cartilla.ExportExcelPhi(req.body)
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