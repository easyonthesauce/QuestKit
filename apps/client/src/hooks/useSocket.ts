import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export function useSocketConnection(isAuthenticated: boolean) {
  const socketRef = useRef<Socket | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // Connect to socket
    socketRef.current = io('/', {
      auth: {
        token
      }
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to QuestKit server')
      socket.emit('user:online')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from QuestKit server')
    })

    // Listen for real-time events
    socket.on('quest:completed', (data) => {
      toast.success(`🎉 ${data.payload.user.displayName} completed a quest!`)
    })

    socket.on('user:level_up', (data) => {
      toast.success(`🚀 ${data.payload.user.displayName} leveled up to level ${data.payload.newLevel}!`)
    })

    socket.on('user:achievement', (data) => {
      toast.success(`🏆 ${data.payload.user.displayName} unlocked: ${data.payload.achievement.title}!`)
    })

    socket.on('reward:redeemed', (data) => {
      if (data.payload.user.role === 'PARENT') {
        toast(`🎁 ${data.payload.user.displayName} wants to redeem: ${data.payload.reward.title}`)
      }
    })

    socket.on('notification', (data) => {
      const { payload } = data
      switch (payload.type) {
        case 'success':
          toast.success(payload.message)
          break
        case 'info':
          toast(payload.message)
          break
        case 'warning':
          toast(payload.message, { icon: '⚠️' })
          break
        case 'error':
          toast.error(payload.message)
          break
        default:
          toast(payload.message)
      }
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, token])

  return socketRef.current
}