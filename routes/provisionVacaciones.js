const express = require('express');
const router = express.Router();
const provisionVacacionesModelo = require('../models/provisionVacaciones');
const auth = require('../middlewares/auth')

router.post('/consultar', async function (req, res) {
    const lista = await provisionVacacionesModelo.listar(req.body);
    res.send(lista)
})

router.post("/", auth.isAuth, async function (req, res) {
    try {
        await provisionVacacionesModelo.guardar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/pagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.pagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportarAjuste", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.exportarExcelAjuste(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportaPagosDeResumen", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.exportatPagosDeResumen(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})


router.post("/detalle", auth.isAuth, async function (req, res) {
    try {
        await provisionVacacionesModelo.crearDetalles(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detalles", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.listarDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/detalles/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.listarDetallesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get("/pagos/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.listarPagosPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/pagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.listarPago(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/crearPago", auth.isAuth, async function (req, res) {
    try {
        await provisionVacacionesModelo.crearPago(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/eliminar", auth.isAuth, async function (req, res) {
    try {
        await provisionVacacionesModelo.eliminarProvision(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/resumen", async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.resumen(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportar/resumen", async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.exportarResumido(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detallePagos", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.listarPagoDetalles(req.body)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/importar", auth.isAuth, async function (req, res) {
    try {
        const data = await provisionVacacionesModelo.importar(req.body)
        res.send(data)

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.get("/exportarDetalle/:idCabecera", async function (req, res) {
    const data = await provisionVacacionesModelo.exportarDetalle(req.params.idCabecera)
    res.send(data)
})
router.get("/exportarPago/:idCabecera", async function (req, res) {
    const data = await provisionVacacionesModelo.exportarPago(req.params.idCabecera)
    res.send(data)
})
router.post("/editar", async function (req, res) {
    await provisionVacacionesModelo.editar(req.body)
    res.send({ message: "exitoso" })
})

//AJUSTES
router.post("/importarAjustes", auth.isAuth, async function (req, res) {
    const data = await provisionVacacionesModelo.listarAjustes(req.body)
    res.send(data)
})
router.post("/ajustesPorDetalle", auth.isAuth, async function (req, res) {
    const data = await provisionVacacionesModelo.listarAjustes(req.body)
    res.send(data)
})
router.post("/guardarAjuste", auth.isAuth, async function (req, res) {
    await provisionVacacionesModelo.guardarAjuste(req.body, req.user)
    res.send({ message: "exitoso" })
})
router.post("/documentosAjuste", auth.isAuth, async function (req, res) {
    const data = await provisionVacacionesModelo.detallesDocumentosAjustes(req.body)
    res.send(data)
})

router.get("/ajustes/:idCabercera", auth.isAuth, async function (req, res) {
    try {
        const detalles = await provisionVacacionesModelo.ajustesPorCabecera(req.params.idCabercera)
        res.send(detalles)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/detalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionVacacionesModelo.detalleAjusteTrabajador(req.body)
    res.send(data)
})
router.post("/exportarDetalleAjusteTrabajador", auth.isAuth, async function (req, res) {
    const data = await provisionVacacionesModelo.exportarDetalleAjusteTrabajador(req.body)
    res.send(data)
})
module.exports = router