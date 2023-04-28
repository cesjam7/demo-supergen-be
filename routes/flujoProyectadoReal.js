const express = require('express');
const router = express.Router();
var flujoProyectadoRealModelo = require('../models/flujoRealProyectado');
const auth = require('../middlewares/auth');
router.post("/resumenReal", auth.isAuth, async (req, res) => {
    try {
        const data = await flujoProyectadoRealModelo.resumenReal(req.body, req.user);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})
router.post("/resumenDatos", auth.isAuth, async (req, res) => {
    try {
        const data = await flujoProyectadoRealModelo.resumenDatos(req.body, req.user);
        res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.post("/exportar", auth.isAuth, async (req, res) => {
    try {
        const data = await flujoProyectadoRealModelo.exportarExcel(req.body);
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/procesarReal", auth.isAuth, async (req, res) => {
    try {
        await flujoProyectadoRealModelo.procesarReal(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;