import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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

  const register = async (username, password, inviteCode) => {
    // Validate invite code
    const { data: codeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.toUpperCase())
      .single()

    if (codeError || !codeData) {
      return { error: 'Gecersiz davet kodu' }
    }

    if (codeData.use_count >= codeData.max_uses) {
      return { error: 'Bu davet kodu kullanim limitine ulasmis' }
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existing) {
      return { error: 'Bu kullanici adi zaten alinmis' }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        invite_code: codeData.code,
        avatar_color: avatarColor,
        password_hash: passwordHash,
        online: true
      })
      .select()
      .single()

    if (error) {
      return { error: 'Kullanici olusturulamadi: ' + error.message }
    }

    // Increment invite code use count
    await supabase
      .from('invite_codes')
      .update({ use_count: codeData.use_count + 1 })
      .eq('id', codeData.id)

    setUser(newUser)
    localStorage.setItem('mesken_user', JSON.stringify(newUser))
    return { user: newUser }
  }

  const login = async (username, password) => {
    const passwordHash = await hashPassword(password)

    const { data: foundUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single()

    if (error || !foundUser) {
      return { error: 'Kullanici bulunamadi' }
    }

    if (foundUser.password_hash !== passwordHash) {
      return { error: 'Sifre hatali' }
    }

    await supabase.from('users').update({ online: true }).eq('id', foundUser.id)

    setUser(foundUser)
    localStorage.setItem('mesken_user', JSON.stringify(foundUser))
    return { user: foundUser }
  }

  const logout = () => {
    if (user) {
      supabase.from('users').update({ online: false }).eq('id', user.id).then()
    }
    setUser(null)
    localStorage.removeItem('mesken_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
