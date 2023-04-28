var express = require('express');
var router = express.Router();
var ReporteProduccion = require('../models/ReporteProduccion');
var sendEmailModel = require('../models/sendEmail');

const auth = require('../middlewares/auth')

router.get('/getData', async function (req, res, next) {
    try {
        await sendEmailModel.doActivity()
        res.json({ message: "se envio el correo" });

    } catch (error) {
        res.status(500).send(error)
    }
});

module.exports = router;
