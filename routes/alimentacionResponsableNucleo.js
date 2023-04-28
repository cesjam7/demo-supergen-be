const express = require('express');
const router = express.Router();
var alimentacionResponsableNucleoModelo = require('../models/alimentacionResponsableNucleo');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const factores = await alimentacionResponsableNucleoModelo.listar();
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/granjas", auth.isAuth, async (req, res) => {
    try {
        const granjas = await alimentacionResponsableNucleoModelo.listarGranjas();
        res.send(granjas)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoModelo.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableNucleoModelo.editar(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send({ message: error.message})
    }
})

module.exports = router;