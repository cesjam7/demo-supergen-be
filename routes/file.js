var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth')
const path = require("path")
const upload = require("../config/multerImagesStorageConfig");
const uploadFirmMulter = require('../config/multerFirmasStorageConfig')
const fs = require('fs')
router.post("/upload", upload.single("file"), (req, res, next) => {
    try {
        return res.status(201).json({ url: req.file.path, nombre: req.file.originalname, })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/uploads", upload.any(), (req, res, next) => {
    try {
        const files = req.files.map((file) => ({ nombre: file.originalname, url: file.path }))
        return res.status(201).json(files)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/firm/upload/:idUsuario", (req, res, next) => {
    console.log("params", req.params)
    const { idUsuario } = req.params
    if (!fs.existsSync(idUsuario)) {
        console.log("entro al usuario")
        fs.mkdirSync("firmas/" + idUsuario, { recursive: true })
    }
    req.user = idUsuario
    next()

}, uploadFirmMulter.single("file"), (req, res) => {
    try {
        return res.status(201).json({ url: req.file.path, nombre: req.file.originalname, })
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;