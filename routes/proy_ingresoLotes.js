var express = require('express');
var router = express.Router();
var proyIngresoLotesModel = require('../models/proy_ingresoLotes');
const proyLoteDetalleModel = require("../models/proy_loteDetalle")
const auth = require('../middlewares/auth');
router.post("/", auth.isAuth, async (req, res) => {
    try {
        res.send(await proyIngresoLotesModel.guardar(req.body, req.user))
    } catch (error) {
        res.status(500).send(error.message);
    }
})
router.get("/", auth.isAuth, async (req, res) => {
    try {
        res.send(await proyIngresoLotesModel.listar())
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/comparativo/:proyIngresoLote", auth.isAuth, async (req, res) => {
    try {
        const data = await proyIngresoLotesModel.actualizarComparativos(req.params.proyIngresoLote)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
router.get("/listarAprobadosyProyectados", auth.isAuth, async (req, res) => {
    try {
        const lista = await proyIngresoLotesModel.listarProyIngresoAbierto()
        res.send(lista)
    } catch (error) {
        console.log("error 1", error.message)
        res.status(500).send({ message: error.message });
    }
})
router.get("/actualizar/:proyIngresoLoteId/estado/:estado", auth.isAuth, async (req, res) => {
    try {
        await proyIngresoLotesModel.actualizarEstado(req.params.estado, req.params.proyIngresoLoteId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/ultimoIngresoLote", async (req, res) => {
    try {
        const ultimoIngresoLote = await proyIngresoLotesModel.traerUltimoRegistroIngresoLote();
        res.send(ultimoIngresoLote)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyIngresoLotesModel.editar(req.body, req.user)
        await proyLoteDetalleModel.proyectar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
module.exports = router;