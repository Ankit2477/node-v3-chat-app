const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const {genrateMessage,genrateLocationMessage} =require('./utils/messages')
const{  addUser,
        removeUser,
        getUser,
        getUsersInRoom} = require('./utils/users')



const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

app.get('/', (req, res) =>{
    try{
  res.render('index')
    }catch(e){
        console.log(e)
    }
})

// socket is object which contains the info 'connection'. 
// If the server is connected to 5 clients, it'll run 5 times for each
// when working with sockets.io and transerfering data, we are sending and recieving events

io.on('connection', (socket) =>{                             
    console.log('New Web Socket Connection')                
    
     socket.on('join', ({username, room}, callback) => {

     const {error, user} = addUser({id: socket.id, username, room})
      
       if(error){
           return callback(error)
       }

        socket.join(user.room)

     socket.emit('message', genrateMessage('Admin', 'Welcome!'))
     socket.broadcast.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has joined`))
     io.to(user.room).emit('roomData', {
         room: user.room,
         users: getUsersInRoom(user.room)
     })
     callback()
     })

   

     socket.on('sendMessage', (message, callback) =>{   /// sending events
       const user = getUser(socket.id)
     
        const filter = new Filter()
     if(filter.isProfane(message)){
         return callback('Profanity is not allowrd')
     }
     
        
     io.to(user.room).emit('message', genrateMessage(user.username, message))
     callback('delivered')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', genrateMessage('Admin', `${user.username} has left.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users:getUsersInRoom(user.room)
            })
        } 
     
    })

    socket.on('location', (coords, callback) =>{
         const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', genrateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})

server.listen(port, ()=>{
    console.log(`Server has been started on Port ${port}`)
})