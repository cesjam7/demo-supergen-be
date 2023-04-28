var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth')
const logisticaConsultaModel = require("../models/logistica-consulta")
router.post('/orden-servicio/listar', auth.isAuth, async (req, res) => {
    try {
        const data = await logisticaConsultaModel.listarOrdenServicio(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }

});
router.post("/orden-servicio/exportarExcel", auth.isAuth, async (req, res) => {
    try {
        const data = await logisticaConsultaModel.exportarExcelOrdenServicio(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get("/consulta-articulos", auth.isAuth, async (req, res) => {
    try {
        const data = await logisticaConsultaModel.consultaArticulos()
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/consulta-articulos/exportar", auth.isAuth, async (req, res) => {
    try {
        const data = await logisticaConsultaModel.exportarConsultaArticulos()
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;