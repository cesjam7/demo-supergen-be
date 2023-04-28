
var express = require('express');
const Auth = require('../middlewares/auth');
const proyPedidoVentaDetalleModel = require("../models/proyPedidoVentaDetalle")
var router = express.Router();
router.get("/listarPorVenta/:pedidoVentaId", Auth.isAuth, async (req, res) => {
    try {
        res.send(await proyPedidoVentaDetalleModel.listarPorPedidoVentaId(req.params.pedidoVentaId))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar", Auth.isAuth, async (req, res) => {
    try {
        await proyPedidoVentaDetalleModel.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/agregar/:pedidoVentaId", Auth.isAuth, async (req, res) => {
    try {
        await proyPedidoVentaDetalleModel.agregarDetalle(req.body, req.params.pedidoVentaId, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.delete("/:id", Auth.isAuth, async (req, res) => {
    try {
        await proyPedidoVentaDetalleModel.eliminarDetalle(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})



module.exports = router;