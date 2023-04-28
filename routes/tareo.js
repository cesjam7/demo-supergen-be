var express = require('express');
var router = express.Router();
var tareo = require('../models/tareo');
const auth = require('../middlewares/auth');
const TareoConsolidado = require("../models/tareo-consolidado");
router.post("/consulta", auth.isAuth, async (req, res) => {
    try {
        const data = await tareo.tareoConsultaFiltrado(req.body);
        res.json(data)
    } catch (error) {
        console.log("error b", error)
        res.status(500).send(error)
    }
})
router.post("/updatePunchState", auth.isAuth, async (req, res) => {
    try {
        await tareo.updatePunchStateBioTime(req.body, req.user)
        res.json({ message: "Actualizacion exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/getDepartments", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getDepartments()
    res.json(rows)
})
router.post("/concilacionLiquidacion", auth.isAuth, async function (req, res, next) {
    try {
        let rows = await tareo.concilacionLiquidacion(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }

})

router.post("/exportarExcelConcilacionLiquidacion", auth.isAuth, async function (req, res) {
    try {
        const rows = await tareo.exportarExcelConsiliacionLiquidacion(req.body)
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/getiClockTransactionsR", async function (req, res) {
    try {
        const rows = await tareo.getiClockTransactionsRefactor(req.body)
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/getiClockTransactions", async function (req, res, next) {
    let rows = await tareo.getiClockTransactionsRefactor(req.body)
    res.json(rows)
})

router.post("/getCronograma", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getCronograma(req.body)
    res.json(rows)
})

router.post("/horarios/editObservacion/:idHorario", auth.isAuth, async (req, res) => {
    try {
        await tareo.editObservacionDeHorario(req.body.observacion, req.params.idHorario)
        res.json({ message: "Actualizacion exitos" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/getUsuarios", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getUsuarios(req.body)
    res.json(rows)
})
router.post("/getUsuariosSinAdicionales", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getUsuariosSinAdicionales(req.body)
    res.json(rows)
})
router.post("/getUsuariosAdicionales", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getUsuariosAdicionales(req.body)
    res.json(rows)
})
router.post("/storeUsuariosAdicionales", auth.isAuth, async function (req, res, next) {
    let rechazados = await tareo.storeUsuariosAdicionales(req.body)
    let rows = await tareo.getUsuariosAdicionales(req.body)
    res.json({
        rows: rows,
        rechazados: rechazados
    })
})
router.post("/deleteUsuariosAdicionales", auth.isAuth, async function (req, res, next) {
    await tareo.deleteUsuariosAdicionales(req.body)
    let rows = await tareo.getUsuariosAdicionales(req.body)
    res.json(rows)
})
router.get("/getHorarios", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getHorarios()
    res.json(rows)
})

router.post("/getCentroCostos", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getCentroCostos(req.body)
    res.json(rows)
})

router.post("/getHorariosByDepartment", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getHorariosByDepartment(req.body)
    res.json(rows)
})
router.post("/delete-user/", auth.isAuth, async (req, res) => {
    try {
        await tareo.deleteUser(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/verifiedCronograma", auth.isAuth, async function (req, res) {
    try {
        res.json(await tareo.verifiedCopyCronograma(req.body))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/copyCronograma", auth.isAuth, async function (req, res) {
    try {
        await tareo.copyCronograma(req.body, req.user)
        res.json({ message: "Accion exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/saveCronograma", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.saveCronograma(req.body)
    res.json(rows)
})

router.post("/saveHorario", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.saveHorario(req.body)
    res.json(rows)
})

router.post("/exportExcel", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.exportExcel(req.body)
    if (rows.success == true) {
        rows.rutaCompletaTareo = "/supergen-be" + rows.rutaTareo
    }
    res.json(rows)
})

router.get("/getMotivos", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getMotivos()
    res.json(rows)
})

router.get("/getTipoTrabajadores", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.getTipoTrabajadores()
    res.json(rows)
})

router.post("/exportMotivos", auth.isAuth, async (req, res, next) => {
    let rows = await tareo.exportMotivos(req.body)
    res.json(rows)
})
router.get("/types", async (req, res) => {
    res.json(await TareoConsolidado.types());
});
router.post("/find", async (req, res) => {
    try {
        
        res.json(await TareoConsolidado.find(req.body));
    } catch (error) {
        res.status(500).send(error)
    }
});
module.exports = router;