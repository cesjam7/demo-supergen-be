var express = require('express');
var router = express.Router();
var proyLoteDetalle = require('../models/proy_loteDetalle');
const auth = require('../middlewares/auth');

router.post("/proyectar", auth.isAuth, async (req, res) => {

    try {
        await proyLoteDetalle.proyectar(req.body, req.user)
        res.send({ message: "Exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }



})
router.post("/proyectar/lista", auth.isAuth, async (req, res) => {

    try {
        await proyLoteDetalle.proyectarLista(req.body.ingresoLotes, req.user)
        res.send({ message: "Exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }



})

router.get("/listarSemanas/ingresoLote/:proyIngresoId/tipoGenero/:tipoGenero", auth.isAuth, async (req, res) => {
    try {
        res.send(await proyLoteDetalle.listarSemanasPorIngresoLote(req.params.proyIngresoId, req.params.tipoGenero))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/listar/:proyIngresoId/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        const rows = await proyLoteDetalle.exportarExcelDetalle(req.params.proyIngresoId)
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/listar/:proyIngresoId/exportarExcelReal", auth.isAuth, async (req, res) => {
    try {
        const rows = await proyLoteDetalle.exportarExcelDetalleDatosReales(req.params.proyIngresoId)
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})


router.get("/listar/:proyIngresoId", auth.isAuth, async (req, res) => {
    try {
        res.send(await proyLoteDetalle.listarPorIngresoLoteId(req.params.proyIngresoId))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar/:proyIngresoId", auth.isAuth, async (req, res) => {
    try {
        await proyLoteDetalle.editar(req.params.proyIngresoId, req.body)
        res.send({ message: "Exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;