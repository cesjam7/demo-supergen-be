var express = require('express');
var router = express.Router();
var proyRol = require('../models/proyRol');
const auth = require('../middlewares/auth')
router.get("/todos", auth.isAuth,async function (req, res) {
    try {
        const roles = await proyRol.listar();
        res.send(roles)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.get("/:id", auth.isAuth, async(req, res) => {
    try {
        const rolConAcciones = await proyRol.traerRolConAccionesPorId(req.params.id)
        res.send(rolConAcciones)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyRol.guardarRol(req.body)
        res.send({ message: "Exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/actualizar", auth.isAuth, async (req, res) => {
    try {
        await proyRol.actualizarRol(req.body)
        res.send({ message: "Exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await proyRol.eliminaRol(req.params.id)
        res.send({ message: "Exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;
