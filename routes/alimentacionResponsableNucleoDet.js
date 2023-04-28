const express = require('express');
const router = express.Router();
var alimentacionResponsableNucleoDetModelo = require('../models/alimentacionResponsableNucleoDet');
const auth = require('../middlewares/auth');
router.delete("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.eliminarTrabajador(req.params.id);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/:idCabecera", auth.isAuth, async (req, res) => {
    try {
        const factores = await alimentacionResponsableNucleoDetModelo.listarDetalleTrabajadoresPorIdCabecera(req.params.idCabecera);
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/trabajadores/listar/:idUser", auth.isAuth, async (req, res) => {
    try {
        const trabajadores = await alimentacionResponsableNucleoDetModelo.listarTrabajadoresSupergen();
        res.send(trabajadores)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post("/", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/transferir", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.transferir(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/detallePorGranja", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.detallePorGranja(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/trabajador/listarTrabajadores", auth.isAuth, async (req, res) => {
    try {
        const { idUser, fecha } = req.body
        const data = await alimentacionResponsableNucleoDetModelo.listarTrabajadoresPorUsuarioYFecha({ idUser, fecha });
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.get("/trabajador/listarTrabajadores", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.listarTrabajadores(req.user);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/trabajador/listarGuardianesPorFecha", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.listarGuardianesPorFecha({ id: req.user, fecha: req.body.fecha });
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/trabajador/listarGuardianesPorFechaPortal", auth.isAuth, async (req, res) => {
    try {
        const { idUser } = req.body
        const data = await alimentacionResponsableNucleoDetModelo.listarGuardianesPorFechaPortar({ id: idUser, fecha: req.body.fecha });
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.get("/trabajador/listarGuardianes", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.listarGuardianes(req.user);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.get("/trabajador/listarGuardianesPortal", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.listarGuardianesPortal(req.user);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/trabajador/marcar", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.confirmarMarcacion(req.body, req.user);
        res.send({ message: "exitoso confirmacion de marcacion" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/trabajador/marcarFecha", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.confirmarMarcacionEmpleadosFecha(req.body, req.user);
        res.send({ message: "exitoso confirmacion de marcacion" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/borrarMarcacion", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.borrarMarcacion(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/borrarMarcacionCena", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.borrarMarcacionCena(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/guardian/marcar", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoDetModelo.confirmarMarcacionGuardian(req.body, req.user);
        res.send({ message: "exitoso confirmacion de marcacion" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/seleccionarDni", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentacionResponsableNucleoDetModelo.seleccionarTrabajadores(req.body);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

module.exports = router;