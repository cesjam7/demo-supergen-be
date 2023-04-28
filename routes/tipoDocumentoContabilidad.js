var express = require('express');
var router = express.Router();
const tipoDocumentoContabilidadModelo = require('../models/tipoDocumentoContabilidad');
const auth = require('../middlewares/auth')
router.get("/listar", auth.isAuth, async (req, res) => {
    try {
        const documentos = await tipoDocumentoContabilidadModelo.listar()
        res.send(documentos)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/grabar", auth.isAuth, async (req, res) => {
    try {
        await tipoDocumentoContabilidadModelo.grabar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await tipoDocumentoContabilidadModelo.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/eliminar/:tipoDocumentoId", auth.isAuth, async (req, res) => {
    try {
        await tipoDocumentoContabilidadModelo.eliminar(req.params.tipoDocumentoId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router