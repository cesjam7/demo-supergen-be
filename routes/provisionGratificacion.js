const express = require('express');
const router = express.Router();
const provisionGratificacionsModelo = require('../models/provisionGratificacion');
const auth = require('../middlewares/auth')

router.post('/consultar', async function (req, res) {
    const lista = await provisionGratificacionsModelo.listar(req.body);
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await provisionGratificacionsModelo.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detalle", auth.isAuth, async function (req, res) {
    try {
        await provisionGratificacionsModelo.crearDetalles(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detalles", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.listarDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/detalles/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.listarDetallesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/pagos/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.listarPagosPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/pagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.listarPago(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/crearPago", auth.isAuth, async function (req, res) {
    try {
        await provisionGratificacionsModelo.crearPago(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/eliminar", auth.isAuth, async function (req, res) {
    try {
        await provisionGratificacionsModelo.eliminarProvision(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/resumen", async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.resumen(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/pagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.pagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportaPagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.exportatPagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportar/resumen", async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.exportarResumido(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detallePagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.listarPagoDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/importar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.importar(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.get("/exportarDetalle/:idCabecera", async function (req, res) {
    const data = await provisionGratificacionsModelo.exportarDetalle(req.params.idCabecera)
    res.send(data)
})
router.get("/exportarPago/:idCabecera", async function (req, res) {
    const data = await provisionGratificacionsModelo.exportarPago(req.params.idCabecera)
    res.send(data)
})
router.post("/editar", async function (req, res) {
    await provisionGratificacionsModelo.editar(req.body)
    res.send({ message: "exitoso" })
})

//AJUSTES


router.post("/exportarAjuste", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionGratificacionsModelo.exportarExcelAjuste(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/ajustesPorDetalle", auth.isAuth, async function (req, res) {
    const data = await provisionGratificacionsModelo.listarAjustes(req.body)
    res.send(data)
})
router.post("/guardarAjuste", auth.isAuth, async function (req, res) {
    await provisionGratificacionsModelo.guardarAjuste(req.body, req.user)
    res.send({ message: "exitoso" })
})

router.get("/ajustes/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionGratificacionsModelo.ajustesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/documentosAjuste", auth.isAuth, async function (req, res) {
    const data = await provisionGratificacionsModelo.detallesDocumentosAjustes(req.body)
    res.send(data)
})
router.post("/detalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionGratificacionsModelo.detalleAjusteTrabajador(req.body)
    res.send(data)
})
router.post("/exportarDetalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionGratificacionsModelo.exportarDetalleAjusteTrabajador(req.body)
    res.send(data)
})
module.exports = router