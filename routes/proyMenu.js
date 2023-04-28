var express = require('express');
var router = express.Router();
var proyMenu = require('../models/proyMenu');
const auth = require('../middlewares/auth');
router.get("/", auth.isAuth, async (req, res) => {
    try {
        const menus = await proyMenu.listar();
        res.send(menus)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyMenu.guardar(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyMenu.editar(req.body);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;
