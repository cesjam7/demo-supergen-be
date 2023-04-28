var express = require('express');
var router = express.Router();
var galpones = require('../models/galpones');
const auth = require('../middlewares/auth');
const estadisticaReqModel = require('../models/estadisiticaRequerimiento');

router.post("/guardarEstadistica", auth.isAuth, async (req, res) => {
    try {
        await estadisticaReqModel.guardarCodigoEsoftcom(req.body, req.body.numeroMaximoEsoftcom)
        res.json({ message: "se guardo correctamente" })
    } catch (error) {
        res.status(500).send(error)
    }

})

module.exports = router;