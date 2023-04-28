var express = require('express');
var router = express.Router();
var proyStandarHembra = require('../models/proyStandardHembra');
const auth = require('../middlewares/auth');
const upload = require('../config/multerXmlFileStorageConfig')

router.get("", auth.isAuth, async function (req, res) {
    try {
        const listaDeProyecciones = await proyStandarHembra.listar();
        res.send(listaDeProyecciones)
    } catch (error) {
        res.status(500).send(error)

    }
})

router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyStandarHembra.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/importarExcel", auth.isAuth, upload.single("file"), async (req, res) => {
    try {
        const data = await proyStandarHembra.importar(req.file.path)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.post("/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        const data = await proyStandarHembra.exportarExcel(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)

    }
})

router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyStandarHembra.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/proyectar", auth.isAuth, async (req, res) => {
    try {
        await proyStandarHembra.proyectar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.get("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await proyStandarHembra.eliminar(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
module.exports = router;