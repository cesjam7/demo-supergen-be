const express = require(`express`);
const router = express.Router();
const auth = require('../middlewares/auth');
const cajaChicaModel = require("../models/cajaChica")
const { isAuth } = require('../middlewares/auth');
const moment = require('moment');


router.post("/guardar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.guardar(req.body, req.user);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/editar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.editar(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/agregarArchivo", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.agregarArchivo(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/dataResumido", isAuth, async (req, res) => {
    try {
        const data = await cajaChicaModel.dataResumido(req.body);
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/exportarExcelDetallado", isAuth, async (req, res) => {
    try {
        const ruta = await cajaChicaModel.exportarExcelDetallado(req.body);
        res.send(ruta)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/exportarExcelResumido", isAuth, async (req, res) => {
    try {
        const ruta = await cajaChicaModel.exportarExcelResumido(req.body);
        res.send(ruta)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/transferirSispagLotes", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.transferirSispagEnLote(req.body, req.user);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/transferirSispag", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.transferirSisPag(req.body, req.user);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/aprobarContabilidad/:cajaChicaId", isAuth, async (req, res) => {

    try {
        await cajaChicaModel.aprobarContabilidad(req.params.cajaChicaId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/enviarAAprobar/:cajaChicaId", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.enviarAAprobar(req.params.cajaChicaId, req.user);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/enviarARevisar/:cajaChicaId", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.enviarARevisar(req.params.cajaChicaId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/listar", isAuth, async (req, res) => {
    try {
        const cajaChica = await cajaChicaModel.listFilterDateAndUpp(req.body, req.user);
        res.send(cajaChica)
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post("/cerrar/:cajaChicaId", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.cerrar(req.params.cajaChicaId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message);
    }

})
router.post("/aprobar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.aprobarCajaChicaGerencia(req.body, req.user);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message);
    }
})
router.post("/aprobarParcialmente", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.enviarAAprobarParcialmente(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message);
    }
})

router.post("/actualizarDetalle", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.actualizarCajaChicaDetalle(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})
router.get("/liquidar/:detalleId", isAuth, async (req, res) => {

    try {
        await cajaChicaModel.liquidarDetalle(req.params.detalleId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/rechazar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.rechazarPorGerencia(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/listarPorFechas", isAuth, async (req, res) => {
    try {
        const cajaChica = await cajaChicaModel.listarPorFechas(req.body);
        res.send(cajaChica)
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get("/placas", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarPlacas()
        res.send(lista)
    } catch (error) {
        res.status(500).send(error);
    }

})
router.post("/placa/grabar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.grabarPlaca(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})
router.post("/placa/editar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.editarPlaca(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})
router.get("/placa/:placaId/eliminar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.eliminarPlaca(req.params.placaId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})
router.get("/tipo", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarTipo()
        res.send(lista)
    } catch (error) {
        res.status(500).send(error);
    }

})
router.post("/tipo/grabar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.grabarTipo(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})
router.post("/tipo/editar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.editarTipo(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})

router.post("/resposable", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.guardarResponsable(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/reevaluarSunat", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.reevaluarSunat(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.delete("/responsable/:id", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.eliminarResponsable(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }


})
router.post("/resposable/editar", isAuth, async (req, res) => {
    try {
        await cajaChicaModel.editarResponsable(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/listarResponsable", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarResponsable();
        res.send(lista);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get("/listarUpp", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarUpp()
        res.send(lista)
    } catch (error) {
        res.status(500).send(error);
    }

})
router.get("/detalle/:id", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarDetallePorId(req.params.id)
        res.send(lista)
    } catch (error) {
        res.status(500).send(error);
    }

})

router.get("/listarResponsable/:upp", isAuth, async (req, res) => {
    try {
        const lista = await cajaChicaModel.listarResponsablesForUpp(req.params.upp);
        res.send(lista);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get("/correlativoUpp/:upp", isAuth, async (req, res) => {
    try {
        const correlativo = await cajaChicaModel.ultimoCorrelativoPorUpp(req.params.upp);
        res.send(correlativo);
    } catch (error) {
        res.status(500).send(error);
    }
})


module.exports = router;

