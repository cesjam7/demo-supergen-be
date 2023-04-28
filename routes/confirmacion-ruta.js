const express = require(`express`);
const router = express.Router();
const auth = require('../middlewares/auth');
const confirmacionRutaModelo = require("../models/confirmacion-ruta")
const { isAuth } = require('../middlewares/auth');
const moment = require('moment');


router.get('/rutas', auth.isAuth, async function (req, res) {

    try {
        const data = await confirmacionRutaModelo.listarRutas()
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/confirmarRuta', auth.isAuth, async function (req, res) {
    try {
        await confirmacionRutaModelo.confirmarRuta(req.body, req.user)
        res.send({ message: 'Exitoso' })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/confirmarRutaFecha', auth.isAuth, async function (req, res) {
    try {
        const { empleados, fecha } = req.body
        await confirmacionRutaModelo.confirmarRuta(empleados, req.user, fecha)
        res.send({ message: 'Exitoso' })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/confirmarRutaGuardian', auth.isAuth, async function (req, res) {
    try {
        await confirmacionRutaModelo.confirmarRutaGuardian(req.body, req.user)
        res.send({ message: 'Exitoso' })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get('/listarTrabajadores', auth.isAuth, async function (req, res) {
    try {
        const data = await confirmacionRutaModelo.listarTrabajadores(req.user)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/listarTrabajadores', auth.isAuth, async function (req, res) {
    try {
        const { fecha, idUser } = req.body
        const data = await confirmacionRutaModelo.listarTrabajadoresPorFecha(idUser, fecha)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/borrarMarcacionCenaMovilidad', auth.isAuth, async function (req, res) {
    try {
        await confirmacionRutaModelo.eliminarCenaMovilidad(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post('/listarGuardianesPorFechaPortal', auth.isAuth, async function (req, res) {
    try {
        const { idUser, fecha } = req.body
        const data = await confirmacionRutaModelo.listarGuardianesPorFechaPortal({ id: idUser, fecha })
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get('/listarGuardianes', auth.isAuth, async function (req, res) {
    try {
        const data = await confirmacionRutaModelo.listarGuardianes(req.user)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get('/listarGuardianesPortal', auth.isAuth, async function (req, res) {
    try {
        const data = await confirmacionRutaModelo.listarGuardianesPortal(req.user)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router




