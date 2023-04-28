const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const destinatarioCargasModel = require('../models/destinatariosCargas')
router.post("/", auth.isAuth, async (req, res) => {
    await destinatarioCargasModel.crear(req.body)
    res.send({ message: "exitoso" })
})

router.post("/enviarCorreoCarga", auth.isAuth, async (req, res) => {
    await destinatarioCargasModel.enviarCorreoCarga(req.body)
    res.send({ message: "exitoso" })
})
router.post("/editar", auth.isAuth, async (req, res) => {
    await destinatarioCargasModel.editar(req.body)
    res.send({ message: "exitoso" })
})
router.get("/", auth.isAuth, async (req, res) => {
    const data = await destinatarioCargasModel.listar()
    res.send(data)
})
router.delete("/:idDestinatario", auth.isAuth, async (req, res) => {
    await destinatarioCargasModel.eliminar(req.params.idDestinatario)
    res.send({ message: "exitoso" })
})
module.exports = router