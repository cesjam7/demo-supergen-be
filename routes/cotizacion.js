var express = require('express');
const Auth = require('../middlewares/auth');
const cotizacion = require('../models/cotizacion');
const estadisticaReqModel = require("../models/estadisiticaRequerimiento")
const multer = require('multer');
const { isAuth } = require('../middlewares/auth');
const moment = require('moment');
var router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".xlsx")
    }
})
const upload = multer({ storage: storage });
router.post("/exportProviders", async (req, res) => {
    try {
        if (req.body.rows) {
            const buffers = await cotizacion.exportProviders(req.body);
            res.send(JSON.stringify(buffers))
        } else {
            res.send([])
        }
    } catch (error) {
        console.error(error)
        res.send([])
    }

});
router.post("/import-providers", upload.array("files", 100), async (req, res) => {
    try {
        console.log("files", req.files)
        let resp = await cotizacion.importProviders(req.files, req.body);
        res.send(resp);
    } catch (err) {
        /*    console.error(err)
           let fs = require("fs");
           for (let f of req.files) {
               fs.unlinkSync(f.path);
           } */
        res.status(500).send(err);
    }
});
router.get("/stores", async (_, res) => {
    try {
        let stores = await cotizacion.getStores();
        res.send(stores);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.toString())
    }

});
router.post("/guardar", Auth.isAuth, async (req, res) => {
    try {

        const id = await cotizacion.guardarCotizacion({ user: req.user, ...req.body })
        res.status(200).send({ message: "accion exitosa", id: id })

    } catch (error) {

        res.status(500).send(error)
    }
})
router.get("/formasPago", Auth.isAuth, async (req, res) => {
    try {
        const rows = await cotizacion.getFormaPago();
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.delete("/archivo/:idArchivo/delete", async (req, res) => {
    try {
        await cotizacion.deleteFile(req.params.idArchivo)
        res.json({ message: "accion exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/listarCotizacionesFiltros", async (req, res) => {
    try {
        const rows = await cotizacion.listarCoticacionesFiltrados(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/ultimoRegistro", Auth.isAuth, async (req, res) => {
    try {
        const number = await cotizacion.ultimoCorrelativoCotizacion();
        res.json(number)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/tipoCambioEsoftcom", Auth.isAuth, async (req, res) => {
    try {
        const tipoCambio = await cotizacion.traerTipoCambioEsoftCom();
        res.json(tipoCambio)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/ultimoNumeroCotizacionEsoftcom", Auth.isAuth, async (req, res) => {
    try {
        const ultimoNumero = await cotizacion.traerNumeroMaximoEsoftCom();
        res.json(ultimoNumero)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/transferirEsoftcom", Auth.isAuth, async (req, res) => {

    try {
        await cotizacion.transferirAEsoftCom(req.body, req.user)
        await estadisticaReqModel.guardarCodigoEsoftcom(req.body, req.body.numeroMaximoEsoftcom)
        res.json({ message: "transferencia exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarConsolidado", Auth.isAuth, async (req, res) => {
    try {
        const message = await cotizacion.exportarExcelCotizacionConsolidado(req.body)
        res.json(message)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/anular/:id", Auth.isAuth, async (req, res) => {
    try {
        await cotizacion.anularCotizacion(req.params.id)
        res.send({ message: "Exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aprobarSolicitudCotizacion/", Auth.isAuth, async (req, res) => {
    try {
        console.log("user", req.user)
        await cotizacion.transicionarCotizacionEstadoDePorAprobarAAprobado(req.body, req.user)
        res.json({ message: "se actualizo correctamente" })

    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/cotizacionProv/guardarCambios", Auth.isAuth, async (req, res) => {
    try {
        await cotizacion.actualizarEstadoDetalleProv(req.body)
        res.json({ message: "se actualizo correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/cotizacionProv/:cotizacionId", Auth.isAuth, async (req, res) => {
    try {
        const cotizacionDetProv = await cotizacion.detalleProvPorCotizacion(req.params.cotizacionId)
        res.json(cotizacionDetProv)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/actualizar/cotizacionProv", Auth.isAuth, async (req, res) => {
    try {
        await cotizacion.actualizarCotizacionProv(req.body)
        res.json({ message: "cotizacion prov actualizada" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/enviarAAprobarCotizacion/", Auth.isAuth, async (req, res) => {
    try {
        await cotizacion.enviarAprobarCotizacion(req.body)
        res.json({ message: "cotizacion actualizada" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar", Auth.isAuth, async (req, res) => {
    try {
        const number = await cotizacion.editarCotizacion(req.body);
        res.json(number)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/volverAAprobar", Auth.isAuth, async (req, res) => {
    try {
        await cotizacion.enviarDeAprobadoAPorAprobar(req.body)
        res.json({ message: "actualizacion exitosa" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcel", Auth.isAuth, async (req, res) => {
    try {
        const rows = await cotizacion.exportarCotizaciones(req.body)
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.get("/deleteCotizacionProv/:id", isAuth, async (req, res) => {
    try {
        await cotizacion.eliminarCotizacionProv(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/validarRequerimientoEnCotizacion/:idRequerimientoDetalle", isAuth, async (req, res) => {
    try {
        const data = await cotizacion.validarRequerimientoEnCotizacion(req.params.idRequerimientoDetalle)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/delete/:id", isAuth, async (req, res) => {
    try {
        await cotizacion.eliminarCotizacion(req.params.id)
        res.send({ message: "se elimino correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/detalles/:idCotizacion", Auth.isAuth, async (req, res) => {
    try {
        const rows = await cotizacion.detallesPorCotizacion(req.params.idCotizacion)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcelFiltrado", Auth.isAuth, async (req, res) => {
    const rows = await cotizacion.exportarExcelFiltrado(req.body)
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
router.post("/filtrarPorProveedorYFecha", Auth.isAuth, async (req, res) => {
    try {
        const bodyRequest = req.body;
        const rows = await cotizacion.filtrarPorProveedorYFechas(bodyRequest.supplier.AC_CCODIGO, bodyRequest.fechaInicio, bodyRequest.fechaFin)
        res.json(rows)
    } catch (error) {

        res.status(500).send(error)
    }
})
router.get("/listar", async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query
        const cotizaciones = await cotizacion.listarCotizaciones(fechaInicio || moment().subtract(15, "days").format("YYYY-MM-DD"), fechaFin || moment().format("YYYY-MM-DD"));
        res.json(cotizaciones)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;