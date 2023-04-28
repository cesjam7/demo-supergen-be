const express = require('express');
const router = express.Router();
var alimentacionResponsableModelo = require('../models/alimentacionResponsable');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const factores = await alimentacionResponsableModelo.listar();
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableModelo.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error.message })
    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableModelo.editar(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.delete("/:alimentacionResponsableId", auth.isAuth, async (req, res) => {
    try {
        await alimentacionResponsableModelo.editar(req.params.alimentacionResponsableId);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;