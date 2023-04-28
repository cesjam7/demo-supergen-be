const express = require(`express`);
const router = express.Router();
const varios = require('../models/varios')
router.get("/", async (_, res) => {
    try {
        const data = await varios.consultaVarios();
        res.send(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

});

module.exports = router;