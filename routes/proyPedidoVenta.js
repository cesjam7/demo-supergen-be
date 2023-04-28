var express = require('express');
const Auth = require('../middlewares/auth');
const proyPedidoVentaModel = require("../models/proyPedidoVenta")
const proyDetalleLoteResumenModel = require("../models/proyDetalleLoteResumen")

var router = express.Router();

router.post("", Auth.isAuth, async (req, res) => {
    try {
        await proyPedidoVentaModel.crear(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/editar", Auth.isAuth, async (req, res) => {
    try {
        await proyPedidoVentaModel.editar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/pedidoConsolidado/exportar", Auth.isAuth, async (req, res) => {
    try {
        console.log("edntro")
        const data = await proyPedidoVentaModel.exportarExcelConsolidado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/pedidoConsolidado", Auth.isAuth, async (req, res) => {
    try {
        const data = await proyPedidoVentaModel.pedidosConsolidado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/listar", Auth.isAuth, async (req, res) => {
    try {
        const rows = await proyPedidoVentaModel.listar();
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcelPedidoVenta", Auth.isAuth, async (req, res) => {
    try {
        const { fechaInicio, fechaFin, rucClientes } = req.body
        const rows = await proyPedidoVentaModel.exportarExel({ fechaFin, fechaInicio, rucClientes });
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/ingreso-total", Auth.isAuth, async (req, res) => {
    try {
        const rows = await proyDetalleLoteResumenModel.totalIngreso(req.body);
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/graficaHiBbsRealProyectado", async (req, res) => {
    try {
        res.send(await proyDetalleLoteResumenModel.listarTotalHiBbsRealYProyectadoPorSemanaYAño(req.body))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/cumplimientoCliente", async (req, res) => {
    try {
        res.send(await proyDetalleLoteResumenModel.porcentajeCumplimientoClientePorAnio(req.body))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/exportarExcel", async (req, res) => {
    try {
        const rows = await proyDetalleLoteResumenModel.exportarExcel();
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)

    }

})
router.get("/lotes", async (req, res) => {
    try {
        const data = await proyDetalleLoteResumenModel.lotes();
        res.send(data)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/porcentajeNacimientoRealProyectado", async (req, res) => {
    try {
        const data = await proyDetalleLoteResumenModel.porcentajeNacimientoRealVsProyectadoPorLotes(req.body);
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/comparativoHi", async (req, res) => {
    try {
        const data = await proyDetalleLoteResumenModel.comparativoHiPorLotes(req.body);
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcelResumen", async (req, res) => {
    try {
        const rows = await proyDetalleLoteResumenModel.exportarExcelResumen(req.body);
        rows.rutaCompletaCM = "/supergen-be" + rows.rutaCM
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)

    }

})
module.exports = router;