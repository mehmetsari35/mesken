import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mesken_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('mesken_user')
      }
    }
    setLoading(false)
  }, [])

  const validateInviteCode = async (code) => {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) {
      return { valid: false, error: 'Geçersiz davet kodu' }
    }

    if (data.is_used && data.used_by) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.used_by)
        .single()

      if (existingUser) {
        const userData = existingUser
        setUser(userData)
        localStorage.setItem('mesken_user', JSON.stringify(userData))
        return { valid: true, existingUser: true, user: userData }
      }
    }

    return { valid: true, existingUser: false, codeId: data.id, code: data.code }
  }

  const createUser = async (username, codeId, code) => {
    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username,
        invite_code: code,
        avatar_color: avatarColor,
        online: true
      })
      .select()
      .single()

    if (error) {
      return { error: 'Kullanıcı oluşturulamadı: ' + error.message }
    }

    await supabase
      .from('invite_codes')
      .update({ is_used: true, used_by: newUser.id })
      .eq('id', codeId)

    setUser(newUser)
    localStorage.setItem('mesken_user', JSON.stringify(newUser))
    return { user: newUser }
  }

  const logout = () => {
    if (user) {
      supabase.from('users').update({ online: false }).eq('id', user.id).then()
    }
    setUser(null)
    localStorage.removeItem('mesken_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, validateInviteCode, createUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
