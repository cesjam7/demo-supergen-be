var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth')
const contabCpe = require('../models/contab_cpe')

const upload = require("../config/multerXmlFileStorageConfig");

router.post("/save", auth.isAuth, async function (req, res) {
    try {
        await contabCpe.save(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }
})
router.get("/detractions", auth.isAuth, async function (req, res) {
    const detractions = await contabCpe.getDetractions()
    res.send(detractions)

})
router.get("/getValueIgv", auth.isAuth, async function (req, res) {
    try {
        console.log("entro al igv value")
        const igvValue = await contabCpe.getIgvValue()
        res.send({ igvValue })
    } catch (error) {
        console.error("e", error)
        res.status(500).send(error)
    }

})
router.post("/list/filter", async function (req, res) {
    try {
        const listContabCpe = await contabCpe.list(req.body)
        res.send(listContabCpe)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/exportarExcel", async function (req, res) {
    try {
        const { data, filtros } = req.body
        const ruta = await contabCpe.exportExcel(data, filtros)
        res.send(ruta)
    } catch (error) {
        res.status(500).send(error)
    }
})



router.get("/destinatarios", auth.isAuth, async (req, res) => {
    try {
        const data = await contabCpe.listarDestinatarios();
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/destinatarios/:destinatarioId/eliminar", auth.isAuth, async (req, res) => {
    try {
        await contabCpe.eliminarDestinatario(req.params.destinatarioId);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/destinatario/grabar", auth.isAuth, async (req, res) => {

    try {
        await contabCpe.guardarDestinatario(req.body)
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/destinatario/editar", auth.isAuth, async (req, res) => {

    try {
        await contabCpe.editarDestinatario(req.body)
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/anular/:contabCpeId", auth.isAuth, async (req, res) => {

    try {
        await contabCpe.anular({ id: req.params.contabCpeId, userId: req.user })
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/revaluateSunat", async function (req, res) {
    try {
        await contabCpe.revaluateSunat(req.body)
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/list/typeDocuments", auth.isAuth, async (req, res) => {
    try {
        const documents = await contabCpe.getListTypeDocument()
        res.send(documents)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/lastNumber", auth.isAuth, async (req, res) => {
    try {
        const number = await contabCpe.lastNumberOfOrder()
        res.send(number)
    } catch (error) {
        res.status(500).send(error)
    }


})

router.get("/descargar/xml/", async (req, res) => {
    try {
        res.setHeader("Content-Type", "application/xml")
        console.log("dd", req.query.path)
        res.download(req.query.path)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/transformXmlToJson", upload.single("file"), async function (req, res) {
    try {

        const json = await contabCpe.transformXmlToJson(req.file.path)
        res.send(json)
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post("/addPdf", auth.isAuth, async function (req, res) {
    try {
        const { file, contabId } = req.body
        await contabCpe.addPdf(file, contabId)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/transferir", auth.isAuth, async function (req, res) {
    try {
        await contabCpe.transferConcar(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/ajustesExtranet/:nombre", auth.isAuth, async function (req, res) {
    try {
        const value = await contabCpe.getAjustesExtranetObectForProperty(req.params.nombre)
        res.send({ value })
    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router;