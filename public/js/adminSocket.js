const socket = io()
socket.emit('joinAdminRoomForUser', 'dashboard')

const onlineUsersList = document.getElementById('onlineUsersList')

socket.on('updateOnlineUsers', (userIds) => {
  if (!onlineUsersList) return
  onlineUsersList.innerHTML = ''
  userIds.forEach(id => {
    const li = document.createElement('li')
    li.innerHTML = `<a href="/admin/chat/${id}">User: ${id}</a>`
    onlineUsersList.appendChild(li)
  })
})
