const express = require(`express`);
const router = express.Router();
const requerimiento = require('../models/requerimientos')
const auth = require('../middlewares/auth');
const { isAuth } = require('../middlewares/auth');
const moment = require('moment');


router.get("/black-list-products", async (_, res) => {
    const list = await requerimiento.getBlackListProducts();
    res.send(list);
});
router.get('/ultimo-registro/:ccosto', async (req, res) => {
    try {
        const maxId = await requerimiento.selectMaxReq(req.params.ccosto, req.query.year);
        res.json(maxId)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/actualizar/requerimientoDet", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.actualizarCantidadRequerimientoDet(req.body)
        res.json({ message: "se actualizo correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/actualizar/requerimientoDet/actualizarCantidadRecepcionada", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.updateCantidadRecepcionada(req.body)
        res.json({ message: "exitoso" })
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/actualizar/requerimientoDet/actualizarCantidadRecepcionada/lotes", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.actualizarCantidadRecepcionadaLotes(req.body)
        res.json({ message: "exitoso" })
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/logistica-consulta/exportar", auth.isAuth, async (req, res) => {
    try {
        const rows = await requerimiento.exportarExcelConsultaLogistica(req.body)
        res.json(rows)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.get("/estadisitica/:requerimientoId/:code", auth.isAuth, async (req, res) => {
    try {
        const estadistica = await requerimiento.estadisticaPorRequerimiento(req.params.requerimientoId, req.params.code)
        res.json(estadistica)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.get("/status/:id", async (req, res) => {
    try {
        const rows = await requerimiento.statusPerRequirement(req.params.id, req.query.code)
        res.json(rows)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
});

router.post("/consultas/requerimientoConsolidado", auth.isAuth, async (req, res) => {
    try {
        console.log("ejecuto")
        const data = await requerimiento.consultaRequerimientoConsolidado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/consultas/requerimientoConsolidado/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        const data = await requerimiento.exportarExcelRequerimientoConsolidado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/statuspormes/", async (req, res) => {
    try {
        var codes = req.body.codes.split(',');
        codes = codes.filter(p => p !== '' && p !== undefined && p !== null);
        codes = codes.join(',');
        const rows = await requerimiento.statusAllRequirement(req.body.idRequerimiento, codes)
        res.json(rows)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
});
router.put("/regresarRequerimiento/:idRequerimiento", async (req, res) => {
    try {

        await requerimiento.regresarRequerimiento(req.params.idRequerimiento)
        res.json({ message: "Exitoso" })
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message })
    }
});
router.get("/estaditicaFecha", async (req, res) => {
    try {
        const estadistica = await requerimiento.estadisticaRequerimientoFiltradoPorFechaMayores(moment().subtract(60, "days")
            .format("YYYY-MM-DD"))
        res.json(estadistica)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.get("/requerimientoDet/calculoEstadistica", async (req, res) => {
    try {
        await requerimiento.calculoFechaEnvioCantidadEnviadaEstadoData()
        res.status(200).send({ message: "exitoso" })
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/requerimientoConsulta/mensual", async (req, res) => {
    try {
        const data = await requerimiento.getInformacionRequerimientoMensual(req.body)
        res.status(200).send(data)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/requerimientoConsulta/mensual/exportar", async (req, res) => {
    try {
        const data = await requerimiento.exportarInformacionRequerimientoMensual(req.body)
        res.status(200).send(data)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/requerimientoConsulta/cumplimiento", async (req, res) => {
    try {
        const data = await requerimiento.getInformacionRequerimientoCumplmiento(req.body)
        res.status(200).send(data)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/requerimientoConsulta/cumplimiento/exportar", async (req, res) => {
    try {
        const data = await requerimiento.exportarInformacionRequerimientoCumplimiento(req.body)
        res.status(200).send(data)
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})
router.post("/filtrarRequerimiento", auth.isAuth, async (req, res) => {
    try {
        const results = await requerimiento.filtrarRequerimientoFechaYUnidadProductiva(req.body)
        res.json(results)
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
})
router.post("/filtrarRequerimientoMensual", auth.isAuth, async (req, res) => {
    try {
        const results = await requerimiento.filtrarRequerimientoFechaYUnidadProductivaMensual(req.body)
        res.json(results)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aprobarRequerimiento", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.aprobarDetalleYRequerimiento({ user: req.user, ...req.body.requerimiento }, req.body.detalles)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcel/granja", auth.isAuth, async (req, res) => {
    const { mostrarUsuarioAprobacion, mostrarUsuarioRevision } = req.query
    console.log("us", mostrarUsuarioAprobacion)
    const rows = await requerimiento.exportarExcelRequerimientoGranja(req.body, mostrarUsuarioRevision, mostrarUsuarioAprobacion)
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
router.post("/exportarExcel/planta", auth.isAuth, async (req, res) => {
    const { mostrarUsuarioAprobacion, mostrarUsuarioRevision } = req.query
    const rows = await requerimiento.exportarExcelRequerimientoPlanta(req.body, mostrarUsuarioRevision, mostrarUsuarioAprobacion)
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
router.post("/guardarMotivo", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.saveMotivo(req.body)
        res.json({ message: "Se registro correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/guardarMarca", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.saveMarca(req.body)
        res.json({ message: "se registro correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editarMarca/:marcaId", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.editMarca(req.body, req.params.marcaId)
        res.json({ message: "se actualizo correctamente" })

    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/editarMotivo/:motivoId", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.editMotivo(req.body, req.params.motivoId)
        res.json({ message: "se actualizo correctamente" })

    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcel/administracion", auth.isAuth, async (req, res) => {
    const { mostrarUsuarioAprobacion, mostrarUsuarioRevision } = req.query
    const rows = await requerimiento.exportarExcelRequerimientoAdministracion(req.body, mostrarUsuarioRevision, mostrarUsuarioAprobacion,)
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

router.post("/rechazarReq", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.rechazarRequerimiento(req.body.requerimientoId, req.user, req.body.textoRechazo)
        res.json({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})

router.post("/cerrarReq", auth.isAuth, async (req, res) => {
    try {
        const message = await requerimiento.cierreReq({ user: req.user, ...req.body })
        res.json(message)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.eliminarRequerimiento(req.params.id)
        res.json({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get('/:ccosto', async (req, res) => {
    const { fechaInicio, fechaFin, estadoRequerimiento } = req.query
    const fechaInicioMoment = moment().subtract(15, "day").format("YYYY-MM-DD")
    let rows = await requerimiento.getAllreqFindCcosto(req.params.ccosto, fechaInicio || fechaInicioMoment, fechaFin || moment().format("YYYY-MM-DD"), estadoRequerimiento);
    res.json(rows)
})
router.get("/product/:productCode", async (req, res) => {
    try {
        let rows = await requerimiento.getHistoricForProduct(req.params.productCode)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }

})

router.post('/Planta', auth.isAuth, async (req, res) => {
    try {
        const data = await requerimiento.addReqPlanta({ idUsuario: req.user, ...req.body });
        res.json(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post('/Admin', async (req, res) => {
    try {
        let rows = await requerimiento.addReqAdmin(req.body);
        res.json(rows);
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/Granja", auth.isAuth, async (req, res) => {
    try {
        const rows = await requerimiento.addReqGranja({ idUsuario: req.user, ...req.body });
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }

});
router.get('/getTipo/Req', async (req, res) => {
    let rows = await requerimiento.getTIpoReq();
    res.json(rows);
})
router.get('/getTipo/Motivo', async (req, res) => {
    let rows = await requerimiento.getTIpoMotivo();
    res.json(rows);
})
router.get('/getTipo/Prioridad', async (req, res) => {
    let rows = await requerimiento.getPrioridad();
    res.json(rows);
})
router.get('/getTipo/Area', async (req, res) => {
    let rows = await requerimiento.getArea();
    res.json(rows);
})
router.get('/getTipo/Marca', async (req, res) => {
    let rows = await requerimiento.getMarca();
    res.json(rows);
})
router.get('/getTipo/UM', async (req, res) => {
    let rows = await requerimiento.getUM();
    res.json(rows);
})
router.get('/getTipo/Solicitante', async (req, res) => {
    let rows = await requerimiento.getSolicitantes();
    res.json(rows);
})
router.get('/getDetalleReq/:idReq', async (req, res) => {
    let rows = await requerimiento.getDetalleByIdPlanta(req.params.idReq);
    res.json(rows);
})
router.get("/getDetalleReqGranja/:granjaId", async (req, res) => {
    try {
        res.json(await requerimiento.getDetailByGranja(req.params.granjaId));
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/requerimientos/aprobados", async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query
        res.json(await requerimiento.getRequerimientosAprobados(fechaInicio || moment().subtract(15, "days").format("YYYY-MM-DD"), fechaFin || moment().format("YYYY-MM-DD")))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/requerimientos/reqDetallePorFamiliaYRequerimientosSelect", async (req, res) => {
    try {
        res.json(await requerimiento.getRequerimientoDetPorFamiliasYRequerimientosSeleccionados(req.body.familias, req.body.requerimientos))

    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/requerimientos/familiasRequerimientosAprobados", async (req, res) => {
    try {
        res.json(await requerimiento.getFamiliasPorRequerimientoAprobados(req.body))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aprobar", isAuth, async (req, res) => {
    try {
        await requerimiento.aprobarRequerimiento({ user: req.user, ...req.body })
        res.json({
            message: "Se edito correctamente"
        })
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/guardarSeleccion", auth.isAuth, async (req, res) => {
    try {
        await requerimiento.guardarSeleccionRequerimentDet({ user: req.user, ...req.body })
        res.json({ message: "Se edito correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/getDetallGeneral/:reqId", async (req, res) => {
    try {
        var results = await requerimiento.getDetailGeneral(req.params.reqId);
        res.json(results)

    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/getDetalleReqPlata/:plantaId', async (req, res) => {
    try {
        res.json(await requerimiento.getDetalleByIdPlanta(req.params.plantaId))
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/getDetalleReqAdmin/:idReq', async (req, res) => {
    let rows = await requerimiento.getDetalleByIdAdmin(req.params.idReq);
    res.json(rows);
})
router.put('/UpdatePlanta/:idReq', async (req, res) => {
    try {
        let rows = await requerimiento.updateReqPlanta(req.body, req.params.idReq);
        res.json(rows);
    } catch (error) {
        res.status(500).send(error)
    }
})
router.put('/UpdateAdmin/:idReq', async (req, res) => {
    try {

        let rows = await requerimiento.updateReqAdmin(req.body, req.params.idReq);
        res.json(rows);
    } catch (error) {
        res.status(500).send(error)
    }
})
router.put("/UpdatePlanta/:idReq", auth.isAuth, async (req, res) => {
    try {
        const data = await requerimiento.updateReqPlanta({ idUsuario: req.user, ...req.body }, req.params.idReq)
        res.json(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.put('/UpdateGranja/:idReq', auth.isAuth, async (req, res) => {
    try {
        const rows = await requerimiento.updateReqGranja({ idUsuario: req.user, ...req.body }, req.params.idReq);
        res.json(rows);

    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;