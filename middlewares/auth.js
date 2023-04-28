const jwt = require('jwt-simple');
const moment = require('moment');
const config = require('../config');

function decodeToken(token) {
    const decoded = new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN)
            if (payload.exp <= moment().unix()) {
                reject({
                    status: 401,
                    message: 'El token ha expirado'
                })
            }
            resolve(payload.sub)

        } catch (err) {
            reject({
                status: 500,
                message: 'Invalid token'
            })
        }
    })

    return decoded;
}

var Auth = {
    isAuth: function (req, res, next) {
        if (!req.headers.authorization) {
            return res.status(403).send({ message: 'No tienes autorización' })
        }

        const token = req.headers.authorization.split(' ')[1]
        decodeToken(token)
            .then(response => {
                req.user = response
                next()
            })
            .catch(response => {
                res.status(response.status).send('No tienes autorizacion');
            })
    },

    createToken: function (idUsuario) {
        const payload = {
            sub: idUsuario,
            iat: moment().unix(),
            exp: moment().add(14, 'days').unix(),
        }

        return jwt.encode(payload, config.SECRET_TOKEN)
    }
}

module.exports = Auth
