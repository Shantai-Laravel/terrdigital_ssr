const {Router} = require('express')
const router = Router()

const MessagesController = require('./../controllers/MessagesController')()
const UserController = require('./../controllers/UserController')()


router.get('/api/messages/unreaded', MessagesController.getUnreaded)

router.patch('/api/messages/readed', MessagesController.setAsReaded)


router.get('/api/message', MessagesController.get)

router.post('/api/message', MessagesController.create)

router.patch('/api/message', MessagesController.update)

router.patch('/api/user/callStatus', UserController.chageCallStatus)

router.get('/api/user/random/employee', UserController.getRandomEmployee)

router.post('/api/user/set/botActivated', UserController.setUserBotActivated)

module.exports = router
