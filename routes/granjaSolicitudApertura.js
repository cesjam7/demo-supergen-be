const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const granjaSolicitudAperturaModelo = require('../models/granjaSolicitudApertura');

router.post('/consultar', auth.isAuth, async function (req, res, next) {
    const data = await granjaSolicitudAperturaModelo.consultar(req.body)
    res.send(data)
})
router.post('/solicitar', auth.isAuth, async function (req, res, next) {
    try {
        await granjaSolicitudAperturaModelo.solicitar(req.body, req.user)
        res.send({ message: "exitoso" })

    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})
router.get('/aprobar/:id', auth.isAuth, async function (req, res) {
    await granjaSolicitudAperturaModelo.aprobar(req.params.id, req.user)
    res.send({ message: "exitoso" })
})
router.get('/rechazar/:id', auth.isAuth, async function (req, res) {
    await granjaSolicitudAperturaModelo.rechazar(req.params.id)
    res.send({ message: "exitoso" })
})

router.get("/listar", auth.isAuth, async (req, res) => {
    const data = await granjaSolicitudAperturaModelo.listarPendientes()
    res.send(data)
})

module.exports = router