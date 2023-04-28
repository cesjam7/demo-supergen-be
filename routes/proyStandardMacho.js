var express = require('express');
var router = express.Router();
var proyStandarMacho = require('../models/proyStandardMacho');
const auth = require('../middlewares/auth');
const upload = require('../config/multerXmlFileStorageConfig')

router.get("/", auth.isAuth, async function (req, res) {
    try {
        const listaDeProyecciones = await proyStandarMacho.listar();
        res.send(listaDeProyecciones)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/", auth.isAuth, async (req, res) => {
    try {
        await proyStandarMacho.guardar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        const data = await proyStandarMacho.exportarExcel(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/importarExcel", auth.isAuth, upload.single("file"), async (req, res) => {
    try {
        const data = await proyStandarMacho.importar(req.file.path)
        res.send(data)
    } catch (error) {
        res.status(500).send({message: error.message})
    }
})

router.post("/proyectar", auth.isAuth, async (req, res) => {
    try {
        await proyStandarMacho.proyectar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.post("/editar", auth.isAuth, async (req, res) => {
    try {
        await proyStandarMacho.editar(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
router.get("/eliminar/:id", auth.isAuth, async (req, res) => {
    try {
        await proyStandarMacho.eliminar(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)

    }
})
module.exports = router;