const socket = io() /// It allow send recieve events from server and client both

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

/// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate =document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscoll = () => {
  //New message elemen
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin 

  // visible height
  const visibleHeight = $messages.offsetHeight

  // Height of message container
  const containerHeight = $messages.scrollHeight

  // How far have scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message', (message) =>{
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username:message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm A')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscoll()        
})

socket.on('locationMessage', (location) =>{
  console.log(location)
  const html = Mustache.render(locationTemplate, {

    createdAt: moment(location.createdAt).format('h:mm A'),
    location: location.url,
    username: location.username
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscoll()
})

socket.on('roomData',  ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#siderbar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
     //disable

     $messageFormButton.setAttribute('disabled', 'disabled')
   

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) =>{
      $messageFormButton.removeAttribute('disabled', 'disabled')
      $messageFormInput.value =''
      $messageFormInput.focus()
     //enable

      if(error) {
        return console.log(error)
      }
      console.log('The message has been delivered')
    })
  })

  $sendLocation.addEventListener('click', () =>{
     if(!navigator.geolocation){
       return alert('Geolocation is not supported by your browser!')
     }
     
     $sendLocation.setAttribute('disabled', 'disabled')

     navigator.geolocation.getCurrentPosition((position) =>{
       //console.log(position) 
       socket.emit('location', {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude
        },  () =>{
           console.log('Location shared')
           $sendLocation.removeAttribute('disabled', 'disabled')
        })    
     })
  
  })

  socket.emit('join', {username, room}, (error) => {
     if(error){
       alert(error)
       location.href = '/'
     }
  })
