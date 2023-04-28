const express = require('express');
const router = express.Router();
const provisionCts = require('../models/provisionCts');
const auth = require('../middlewares/auth')

router.post('/consultar', async function (req, res) {
    const lista = await provisionCts.listar(req.body);
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await provisionCts.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/pagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCts.pagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportaPagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCts.exportatPagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})



router.post("/detalle", auth.isAuth, async function (req, res) {
    try {
        await provisionCts.crearDetalles(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detalles", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.listarDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/detalles/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.listarDetallesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/pagos/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.listarPagosPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/pagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.listarPago(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/crearPago", auth.isAuth, async function (req, res) {
    try {
        await provisionCts.crearPago(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/eliminar", auth.isAuth, async function (req, res) {
    try {
        await provisionCts.eliminarProvision(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/resumen", async function (req, res) {
    try {
        const data = await provisionCts.resumen(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportar/resumen", async function (req, res) {
    try {
        const data = await provisionCts.exportarResumido(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detallePagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.listarPagoDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/importar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCts.importar(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.get("/exportarDetalle/:idCabecera", async function (req, res) {
    const data = await provisionCts.exportarDetalle(req.params.idCabecera)
    res.send(data)
})
router.get("/exportarPago/:idCabecera", async function (req, res) {
    const data = await provisionCts.exportarPago(req.params.idCabecera)
    res.send(data)
})
router.post("/editar", async function (req, res) {
    await provisionCts.editar(req.body)
    res.send({ message: "exitoso" })
})

//AJUSTES


router.post("/exportarAjuste", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionCts.exportarExcelAjuste(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/ajustesPorDetalle", auth.isAuth, async function (req, res) {
    const data = await provisionCts.listarAjustes(req.body)
    res.send(data)
})
router.post("/guardarAjuste", auth.isAuth, async function (req, res) {
    await provisionCts.guardarAjuste(req.body, req.user)
    res.send({ message: "exitoso" })
})

router.get("/ajustes/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionCts.ajustesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/detalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionCts.detalleAjusteTrabajador(req.body)
    res.send(data)
})
router.post("/documentosAjuste", auth.isAuth, async function (req, res) {
    const data = await provisionCts.detallesDocumentosAjustes(req.body)
    res.send(data)
})
router.post("/exportarDetalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionCts.exportarDetalleAjusteTrabajador(req.body)
    res.send(data)
})
module.exports = router