var express = require('express');
var router = express.Router();
var proyAccionModel = require('../models/proyAcciones');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const acciones = await proyAccionModel.listarAccionMenu();
        res.send(acciones)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyAccionModel.guardar(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await proyAccionModel.eliminarAccion(req.params.id);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyAccionModel.editar(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})




module.exports = router;