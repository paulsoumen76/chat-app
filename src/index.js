const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()

const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join',({username, room}, callback) => {
        const {error, user} = addUser({id:socket.id, username, room})
        if(error) {
            return callback(error)
        }
        socket.join(user.room)//to join a room
        socket.emit('welcome', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('welcome', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
        //socket.to.emit for a specific room it will send

    })

    socket.on('textFromClient', (text, callback) => {
        const user = getUser(socket.id)      
        const filter = new Filter()
        if(filter.isProfane(text)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('welcome', generateMessage(user.username, text))
        callback()
            
    }) 

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)  
        io.to(user.room).emit('locationMessage',generateMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('welcome', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })//when user disconnect or left
})

server.listen(port, () => {
    console.log('Server is listening on port ' + port)
})