const socket = io()
//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#texts')
const $sidebar = document.querySelector('#sidebar')

//templates
const messageTemplate = document.querySelector('#text-template').innerHTML//to render template we need innerhtml
const locationTemplate = document.querySelector('#location-template').innerHTML 
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML 

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll = () => {

    //new message elemet
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    console.log($newMessage.offsetHeight )

    //visible height
    const visibleHeight = $messages.offsetHeight 
  

    //height of main container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrolloffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrolloffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('welcome', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm A')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        username:url.username,
        url:url.text,
        createdAt:moment(url.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html

})



$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const text = e.target.elements.message.value
    socket.emit('textFromClient', text, (error) => {
        if(error){
            return console.log(error)
        }
        console.log('message is delivered!')
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
    })
})

$sendLocation.addEventListener('click', () => {
    if(!navigator.geolocation){
        alert('Your browser does not support geolocation')
    }

    $sendLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        socket.emit('sendLocation', {latitude,longitude}, () => {           
            console.log('Location is shared!')
            $sendLocation.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room},(error) => {
    if(error) {
        alert(error)
        location.href ='/'
    }
})


