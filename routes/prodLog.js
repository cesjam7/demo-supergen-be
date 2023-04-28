var express = require('express');
var router = express.Router();
const prodLogModel = require("../models/prodLog")
const auth = require('../middlewares/auth')


router.get("/", auth.isAuth, async (req, res) => {
    try {
        const logs = await prodLogModel.list()
        res.send(logs)
    } catch (error) {
        res.status(500).send(error)
    }
})


router.post("/", auth.isAuth, async (req, res) => {
    try {
        await prodLogModel.save(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})

module.exports = router