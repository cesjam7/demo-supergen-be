var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth');
const areaModel = require('../models/area');

router.post("/insertar", auth.isAuth, async (req, res) => {
    try {
        await areaModel.insertar(req.body)
        res.json({ message: "Guardado correctamente" })
    } catch (error) {
        res.status(500).send(error)

    }
})

router.post("/actualizar", auth.isAuth, async (req, res) => {
    try {
        await areaModel.editar(req.body)
        res.json({ message: "Editado correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;