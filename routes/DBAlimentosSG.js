var express = require('express');
const DBAlimentosSG = require('../models/DBAlimentosSG');
const router = express.Router();
const auth = require('../middlewares/auth');


router.post("/listar", async (req, res) => {
    try {
        const rows = await DBAlimentosSG.listarMovimientoAlimentos(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/listarKardex", auth.isAuth, async (req, res) => {
    try {
        res.send(await DBAlimentosSG.listarKardexAlimento(req.body))
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/exportarExcel", async (req, res) => {
    try {
        const ruta = await DBAlimentosSG.exportaExcel(req.body)
        if (ruta.success == true) {
            ruta.rutaCompletaCM = "/supergen-be" + ruta.rutaCM
            res.json(ruta)
        } else {
            res.json({
                success: false,
                message: "Ocurrió un error en el servidor."
            })
        }
        res.json(ruta)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/detallesEditar", async (req, res) => {
    try {
        const rows = await DBAlimentosSG.detallesPorParaEditarMovimientos(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/detalles", async (req, res) => {
    try {
        const detalles = await DBAlimentosSG.detallesPorParaCrearMovimientos(req.body)
        res.json(detalles)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/ultimoRegistro", async (req, res) => {
    try {
        const numberMax = await DBAlimentosSG.ultimoNroAjuste();
        res.json(numberMax)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/crearAjuste", auth.isAuth, async (req, res) => {
    try {

        await DBAlimentosSG.crearAjusteAlimento(req.body, req.user)
        res.json({ message: "creado exitosamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/reaperturarAjustes", auth.isAuth, async (req, res) => {
    try {
        await DBAlimentosSG.reaperturarAjustes(req.body, req.user)
        res.json({ message: "Se actualizo correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aprobarAjuste", auth.isAuth, async (req, res) => {
    try {
        await DBAlimentosSG.aprobarAjusteAlimento(req.body, req.user)
        res.json({ message: "se actualizo correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editarDetalleAjuste", async (req, res) => {
    try {
        await DBAlimentosSG.editarDetalleAjusteAlimento(req.body)
        res.json({ message: "Actualizado exitosamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router;