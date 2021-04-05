const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const users = require('./controllers/Users')()
const conference = require('./controllers/Conference')()
// const auth = require('./controllers/auth')()

const actions = require('./services/ActionService')()

const m = (name, text, id) => ({ name, text, id })

io.on('connection', socket => {

    // Start: employee create a room
    socket.on('employeeJoined', (data, cb) => {
        socket.join(data.roomId)
        cb()
    })

    // Start: client join a room
    socket.on('joinExistingRoom', async (data, cb) => {
        // const response = await conference.createClientUser(data.roomId, data.userId)
        // socket.join(data.roomId)
        // io.to(data.roomId).emit('joinExistingRoom', response)
        // cb()
    })

    // joinRoomAsClient
    socket.on('joinRoomAsClient', async (data, cb) => {
        socket.join(data.roomId)
        io.to(data.roomId).emit('joinRoom', {client: data.client})
        cb()
    })

    // joinRoomAsClient
    socket.on('joinRoomAsEmployee', async (data, cb) => {
        socket.join(data.roomId)
        io.to(data.roomId).emit('joinRoom', {employee: data.employee})
        cb()
    })

    // Update active rooms
    socket.on('updateActiveRooms', async data => {
        io.emit('reloadEmployeeList', data)
    })

    // Create an send a message
    socket.on('createMessage', (data, cb) => {
        if (!data.text) {
            return cb('The text cannot be empty')
        }

        if (data.user && data.room) {
            const res = {
                message: data.message,
                simpleMessage: m(data.user.name, data.text, data.user._id),
            }

            io.to(data.room).emit('newMessage', res)
        }
        cb()
    })

    // Create an send a message
    socket.on('shareHistory', (data) => {
        io.to(data.roomId).emit('shareHistory', data.messages)
    })


    // Video Calling modificators
    socket.on('videoMute', (data) => {
        io.to(data.roomId).emit('videoMute', data.userId)
    })

    socket.on('videoUnmute', (data) => {
        io.to(data.roomId).emit('videoUnmute', data.userId)
    })

    socket.on('audioMute', (data) => {
        io.to(data.roomId).emit('audioMute', data.userId)
    })

    socket.on('audioUnmute', (data) => {
        io.to(data.roomId).emit('audioUnmute', data.userId)
    })

    socket.on('shareUserAction', async data => {
        socket.join(data.userId)
        const action = await actions.addUser(data)
        const actionsAll = await actions.getAllActions()

        io.emit('refreshActions', {action, actionsAll})
    })

    socket.on('shareEmployeeStatus', employee => {
        io.emit('refreshEmployeeStatus', employee)
        socket.join(employee._id)
    })

    socket.on('call', roomId => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('call', {roomId, call: true})
        io.to(roomId).emit('setRoom', {roomId, call: true})
    })

    socket.on('rejectCall', data => {
        io.to(data.roomId).emit('call_reject', true)
    })

    socket.on('responseCall', data => {
        io.to(data.roomId).emit('call_response', true)
    })



  socket.on('userJoined', (data, cb) => {
    if (!data.name || !data.room) {
      return cb('Data is incorrect')
    }

    socket.join(data.room)

    users.remove(socket.id)
    users.add({
      id: socket.id,
      name: data.name,
      room: data.room
    })

    cb({ userId: socket.id })
    io.to(data.room).emit('updateUsers', users.getByRoom(data.room))
    socket.emit('newMessage', m('admin', `Wellcome ${data.name}.`))
    socket.broadcast
      .to(data.room)
      .emit('newMessage', m('admin', `User ${data.name} joined.`))
  })



  socket.on('userLeft', (id, cb) => {
    const user = users.remove(id)
    if (user) {
      io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
      io.to(user.room).emit(
        'newMessage',
        m('admin', `User ${user.name} logged out.`)
      )
    }
    cb()
  })

  socket.on('stop', (roomId) => {
      io.to(roomId).emit('stopChat')
  })

  // socket.on('changeVideoProccess', () => {
  //     io.to('room').emit('changeVideoProccess')
  // })

  // socket.on('changeAudioProccess', () => {
  //     io.to('room').emit('changeAudioProccess')
  // })



  socket.on('disconnect', () => {
    const user = users.remove(socket.id)
    if (user) {
      io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
      io.to(user.room).emit(
        'newMessage',
        m('admin', `User ${user.name} logged out.`)
      )
    }
  })
})

module.exports = {
  app,
  server
}