var express = require('express');
var router = express.Router();
var proyFactorModel = require('../models/proyFactores');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const factores = await proyFactorModel.listar();
        res.send(factores)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyFactorModel.guardar(req.body, req.user);
        res.send({ message: "exito" })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:error.message})
    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyFactorModel.editar(req.body);
        res.send({ message: "exito" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;