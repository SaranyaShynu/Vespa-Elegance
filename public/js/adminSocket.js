const socket = io()
socket.emit('joinAdminRoomForUser', 'dashboard')

const onlineUsersList = document.getElementById('onlineUsersList')

socket.on('updateOnlineUsers', (users) => {
  if (!onlineUsersList) return
  onlineUsersList.innerHTML = ''
  users.forEach(user => {
    const li = document.createElement('li')
    li.innerHTML = `<a href="/admin/chat/${user.id}">User: ${user.name}</a>`
    onlineUsersList.appendChild(li)
  })
})
