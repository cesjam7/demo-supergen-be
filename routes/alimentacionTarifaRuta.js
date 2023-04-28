const express = require('express');
const router = express.Router();
var alimentacionTarifaRuta = require('../models/alimentacionTarifaRuta');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const factores = await alimentacionTarifaRuta.listar();
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/", auth.isAuth, async (req, res) => {
    try {
        await alimentacionTarifaRuta.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await alimentacionTarifaRuta.editar(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.delete("/:id", auth.isAuth, async (req, res) => {
    await alimentacionTarifaRuta.eliminar(req.params.id)
    res.send({ message: "exitoso" })
})

module.exports = router;