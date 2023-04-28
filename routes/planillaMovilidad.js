const express = require(`express`);
const router = express.Router();
const auth = require('../middlewares/auth');
const planillaModel = require("../models/planillaMovilidad")
const { isAuth } = require('../middlewares/auth');
const moment = require('moment');

router.post("/", isAuth, async (req, res) => {
    try {
        await planillaModel.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})

router.get("/enviarAAprobar/:planillaMovilidadId", isAuth, async (req, res) => {
    try {
        await planillaModel.enviarAAprobar(req.params.planillaMovilidadId, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }


})
router.get("/checkPlanilla/:planillaMovilidadId", isAuth, async (req, res) => {
    try {
        await planillaModel.checkCaja(req.params.planillaMovilidadId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/enviarARevisar/:planillaMovilidadId", isAuth, async (req, res) => {
    try {
        await planillaModel.enviarARevisar(req.params.planillaMovilidadId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/listar/agrupados", isAuth, async (req, res) => {
    try {
        const objeto = await planillaModel.listarAgrupados(req.body)
        res.send(objeto)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/listar", isAuth, async (req, res) => {
    try {
        const lista = await planillaModel.listar(req.body)
        res.send(lista)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aprobar", isAuth, async (req, res) => {
    try {
        await planillaModel.aprobarPlanillasPorDetalles(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/rechazar", isAuth, async (req, res) => {
    try {
        await planillaModel.rechazarPlanillasPorDetalles(req.body)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/rechazar", isAuth, async (req, res) => {
    try {
        await planillaModel.rechazarGerencia(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/listarPorEstadosYFechas", isAuth, async (req, res) => {
    try {
        const planillas = await planillaModel.listarPlanillaPorEstadosYFechas(req.body)
        res.send(planillas)
    } catch (error) {
        res.status(500).send(error)
    }

})



router.get("/detalles/:planillaMovilidadId", isAuth, async (req, res) => {
    try {
        const lista = await planillaModel.listarDetallePorPlanilla(req.params.planillaMovilidadId)
        res.send(lista)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/liquidar/:planillaMovilidadId", isAuth, async (req, res) => {
    try {
        await planillaModel.liquidar(req.params.planillaMovilidadId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/editar", isAuth, async (req, res) => {
    try {
        await planillaModel.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }


})
router.post("/exportarExcel", isAuth, async (req, res) => {
    try {
        const data = await planillaModel.exportarExcel(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }


})
router.get("/correlativo/:upp", isAuth, async (req, res) => {
    try {
        const correlativo = await planillaModel.ultimoCorrelativoPorUpp(req.params.upp)
        res.send(correlativo)
    } catch (error) {
        res.status(500).send(error)
    }


})
router.post("/listarPorFechaYUpp", isAuth, async (req, res) => {
    try {
        const lista = await planillaModel.listarPorFechasYUpp(req.body, req.user)
        res.send(lista)
    } catch (error) {
        res.status(500).send(error)
    }


})
router.post("/actualizarDetalles", isAuth, async (req, res) => {
    try {
        await planillaModel.actualizarSeleccionDetalleYTextoRechazo(req.body)
        res.send({ message: "Exito" })
    } catch (error) {
        res.status(500).send(error)
    }


})
module.exports = router