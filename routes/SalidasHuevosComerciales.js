var express = require('express');
var router = express.Router();
var salidasHuevosComercialesModel = require('../models/SalidasHuevosComerciales');
const auth = require('../middlewares/auth');
const SalidasHuevosComerciales = require('../models/SalidasHuevosComerciales');

router.post("/detalleDetallado", auth.isAuth, async (req, res) => {
    try {
        const rows = await salidasHuevosComercialesModel.traerDetalleDetallado(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/cambiarEstadoCancelado", auth.isAuth, async (req, res) => {
    try {
        (await salidasHuevosComercialesModel.actualizarEstadoCancelar({ ...req.body, user: req.user }))
        res.status(200).send({ message: "Success" })
    } catch (err) {
        res.status(500).send(err)
    }
})
router.post("/actualizarNroBoleta", auth.isAuth, async (req, res) => {
    try {
        await salidasHuevosComercialesModel.actualizarNroBoleta(req.body)
        res.json({ message: "Actualizacion exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcel", auth.isAuth, async (req, res) => {
    const rows = await SalidasHuevosComerciales.generarReporte(req.body.params, req.body.rows)
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
router.post("/detalleAgrupado", auth.isAuth, async (req, res) => {
    try {
        const rows = await salidasHuevosComercialesModel.traerDetalleAgrupado(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;