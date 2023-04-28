const express = require('express');
const router = express.Router();
const estadisticaModelo = require("../models/estadistica")
const auth = require('../middlewares/auth')


router.get("/", auth.isAuth, async (req, res) => {
    try {
        const data = await estadisticaModelo.traerDataEstadistica()
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})



module.exports = router