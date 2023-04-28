var express = require('express');
var router = express.Router();
const soliMod = require("../models/solicitante")
router.post("/guardar", async (req, res) => {
    try {
        await soliMod.guardar(req.body)
        res.json({ message: "Guardado exitosamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar", async (req, res) => {
    try {
        await soliMod.editar(req.body)
        res.json({ message: "Editado exitosamente" })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;

