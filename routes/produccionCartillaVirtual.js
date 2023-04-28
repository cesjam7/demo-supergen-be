const express = require('express');
const router = express.Router();
const produccionCartillaVirtualModelo = require('../models/produccionCartillaVirtual');
const auth = require('../middlewares/auth')


router.post("/cartilla", auth.isAuth, async function (req, res) {

    try {
        const data = await produccionCartillaVirtualModelo.cartillaVirtual(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

module.exports = router;
