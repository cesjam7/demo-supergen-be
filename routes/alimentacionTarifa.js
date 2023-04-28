const express = require('express');
const router = express.Router();
var alimentaionTarifaModelo = require('../models/alimentacionTarifa');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const factores = await alimentaionTarifaModelo.listar();
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/", auth.isAuth, async (req, res) => {
    try {
        await alimentaionTarifaModelo.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await alimentaionTarifaModelo.editar(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.delete("/:id", auth.isAuth, async (req, res) => {
    await alimentaionTarifaModelo.eliminar(req.params.id)
    res.send({ message: "exitoso" })
})

module.exports = router;