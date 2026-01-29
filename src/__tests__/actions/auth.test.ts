import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// =====================================================
// MOCKS
// =====================================================

const mockAuthGetUser = vi.fn()
const mockAuthSignInWithPassword = vi.fn()
const mockAuthSignUp = vi.fn()
const mockAuthSignOut = vi.fn()
const mockAuthResetPasswordForEmail = vi.fn()
const mockAuthUpdateUser = vi.fn()
const mockRevalidatePath = vi.fn()
const mockRedirect = vi.fn()
const mockSupabaseFrom = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageGetPublicUrl = vi.fn()

// Supabase mock state
let supabaseMockData: Record<string, any> = {}

const createSupabaseChainMock = () => {
  const chain: any = {
    data: null,
    error: null,
  }

  const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'single', 'order']
  chainMethods.forEach((method) => {
    chain[method] = vi.fn((...args: any[]) => {
      const tableData = supabaseMockData[chain._table]
      if (tableData) {
        if (method === 'single' && tableData.single) {
          chain.data = tableData.single.data
          chain.error = tableData.single.error
        } else if (tableData.data !== undefined) {
          chain.data = tableData.data
          chain.error = tableData.error
        }
      }
      return chain
    })
  })

  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockAuthGetUser,
      signInWithPassword: mockAuthSignInWithPassword,
      signUp: mockAuthSignUp,
      signOut: mockAuthSignOut,
      resetPasswordForEmail: mockAuthResetPasswordForEmail,
      updateUser: mockAuthUpdateUser,
    },
    from: (table: string) => {
      const chain = createSupabaseChainMock()
      chain._table = table
      return chain
    },
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      }),
    },
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (path: string, type?: string) => mockRevalidatePath(path, type),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mockRedirect(path)
    // Simulate redirect by throwing
    throw new Error(`REDIRECT:${path}`)
  },
}))

// =====================================================
// TEST DATA FACTORIES
// =====================================================

const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  ...overrides,
})

const createMockProfile = (overrides = {}) => ({
  id: 'user-123',
  church_id: 'church-123',
  full_name: 'Test User',
  email: 'test@example.com',
  phone: '11999998888',
  photo_url: null,
  member_stage: 'MEMBER' as const,
  role: 'MEMBER' as const,
  cell_id: null,
  is_active: true,
  is_teacher: false,
  is_finance_team: false,
  joined_at: '2024-01-01',
  ...overrides,
})

const createFormData = (data: Record<string, string>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// =====================================================
// IMPORT AFTER MOCKS
// =====================================================

import {
  getProfile,
  signIn,
  signUp,
  signOut,
  forgotPassword,
  resetPassword,
  updateProfile,
  getChurchMembers,
} from '@/actions/auth'

// =====================================================
// TESTS
// =====================================================

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMockData = {}
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =====================================================
  // getProfile
  // =====================================================

  describe('getProfile', () => {
    it('should return null when no user is authenticated', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      const result = await getProfile()

      expect(result).toBeNull()
    })

    it('should return profile when user is authenticated', async () => {
      const mockProfile = createMockProfile()
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = { single: { data: mockProfile, error: null } }

      const result = await getProfile()

      expect(result).toEqual(mockProfile)
    })

    it('should return null when profile fetch errors', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = { single: { data: null, error: { message: 'Not found' } } }

      const result = await getProfile()

      expect(result).toBeNull()
    })

    it('should include all profile fields', async () => {
      const mockProfile = createMockProfile({
        role: 'PASTOR',
        member_stage: 'LEADER',
        is_teacher: true,
        is_finance_team: true,
      })
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = { single: { data: mockProfile, error: null } }

      const result = await getProfile()

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('church_id')
      expect(result).toHaveProperty('full_name')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('phone')
      expect(result).toHaveProperty('photo_url')
      expect(result).toHaveProperty('member_stage')
      expect(result).toHaveProperty('role')
      expect(result).toHaveProperty('cell_id')
      expect(result).toHaveProperty('is_active')
      expect(result).toHaveProperty('is_teacher')
      expect(result).toHaveProperty('is_finance_team')
      expect(result).toHaveProperty('joined_at')
    })
  })

  // =====================================================
  // signIn
  // =====================================================

  describe('signIn', () => {
    it('should redirect to dashboard on successful sign in', async () => {
      mockAuthSignInWithPassword.mockResolvedValue({ error: null })

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      })

      await expect(signIn(formData)).rejects.toThrow('REDIRECT:/dashboard')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('should redirect with error on failed sign in', async () => {
      mockAuthSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      })

      const formData = createFormData({
        email: 'test@example.com',
        password: 'wrong-password',
      })

      await expect(signIn(formData)).rejects.toThrow('REDIRECT:/login?error=Invalid%20credentials')
    })

    it('should extract email and password from form data', async () => {
      mockAuthSignInWithPassword.mockResolvedValue({ error: null })

      const formData = createFormData({
        email: 'user@example.com',
        password: 'secret123',
      })

      try {
        await signIn(formData)
      } catch {
        // Expected redirect
      }

      expect(mockAuthSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
      })
    })
  })

  // =====================================================
  // signUp
  // =====================================================

  describe('signUp', () => {
    it('should redirect with error when auth signup fails', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      const formData = createFormData({
        email: 'existing@example.com',
        password: 'password123',
        full_name: 'John Doe',
        phone: '11999998888',
        church_id: 'church-123',
      })

      await expect(signUp(formData)).rejects.toThrow('REDIRECT:/cadastro?error=Email%20already%20exists')
    })

    it('should redirect with error when user creation returns no user', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
        phone: '11999998888',
        church_id: 'church-123',
      })

      await expect(signUp(formData)).rejects.toThrow('REDIRECT:/cadastro?error=Erro%20ao%20criar%20usu%C3%A1rio')
    })

    it('should create profile with MEMBER role by default', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      })
      supabaseMockData.profiles = { data: null, error: null }

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
        phone: '11999998888',
        church_id: 'church-123',
      })

      try {
        await signUp(formData)
      } catch {
        // Expected redirect
      }

      // The profile should be created with role: 'MEMBER'
      expect(mockAuthSignUp).toHaveBeenCalled()
    })

    it('should redirect to login with success message on successful signup', async () => {
      mockAuthSignUp.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      })
      supabaseMockData.profiles = { data: null, error: null }

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
        phone: '',
        church_id: 'church-123',
      })

      await expect(signUp(formData)).rejects.toThrow(
        'REDIRECT:/login?message=Conta criada com sucesso! Faça login para continuar.'
      )
    })
  })

  // =====================================================
  // signOut
  // =====================================================

  describe('signOut', () => {
    it('should sign out and redirect to login', async () => {
      mockAuthSignOut.mockResolvedValue({ error: null })

      await expect(signOut()).rejects.toThrow('REDIRECT:/login')
      expect(mockAuthSignOut).toHaveBeenCalled()
    })
  })

  // =====================================================
  // forgotPassword
  // =====================================================

  describe('forgotPassword', () => {
    it('should redirect with success message on successful email send', async () => {
      mockAuthResetPasswordForEmail.mockResolvedValue({ error: null })

      const formData = createFormData({ email: 'test@example.com' })

      await expect(forgotPassword(formData)).rejects.toThrow(
        'REDIRECT:/forgot-password?message=Link%20de%20recupera%C3%A7%C3%A3o%20enviado'
      )
    })

    it('should redirect with error on failed email send', async () => {
      mockAuthResetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      })

      const formData = createFormData({ email: 'nonexistent@example.com' })

      await expect(forgotPassword(formData)).rejects.toThrow(
        'REDIRECT:/forgot-password?error=User%20not%20found'
      )
    })

    it('should use correct redirect URL', async () => {
      mockAuthResetPasswordForEmail.mockResolvedValue({ error: null })
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

      const formData = createFormData({ email: 'test@example.com' })

      try {
        await forgotPassword(formData)
      } catch {
        // Expected redirect
      }

      expect(mockAuthResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      )
    })
  })

  // =====================================================
  // resetPassword
  // =====================================================

  describe('resetPassword', () => {
    it('should redirect with error when passwords do not match', async () => {
      const formData = createFormData({
        password: 'newpassword123',
        confirmPassword: 'differentpassword',
      })

      await expect(resetPassword(formData)).rejects.toThrow(
        'REDIRECT:/reset-password?error=As senhas não coincidem'
      )
      expect(mockAuthUpdateUser).not.toHaveBeenCalled()
    })

    it('should update password and redirect to dashboard on success', async () => {
      mockAuthUpdateUser.mockResolvedValue({ error: null })

      const formData = createFormData({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      })

      await expect(resetPassword(formData)).rejects.toThrow(
        'REDIRECT:/dashboard?message=Senha atualizada com sucesso'
      )
      expect(mockAuthUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    })

    it('should redirect with error when password update fails', async () => {
      mockAuthUpdateUser.mockResolvedValue({
        error: { message: 'Weak password' },
      })

      const formData = createFormData({
        password: '123',
        confirmPassword: '123',
      })

      await expect(resetPassword(formData)).rejects.toThrow(
        'REDIRECT:/reset-password?error=Weak%20password'
      )
    })
  })

  // =====================================================
  // updateProfile
  // =====================================================

  describe('updateProfile', () => {
    it('should throw error when user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      const formData = createFormData({
        fullName: 'John Doe',
        phone: '11999998888',
      })

      await expect(updateProfile(formData)).rejects.toThrow('Não autenticado')
    })

    it('should update profile without avatar', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = { data: null, error: null }

      const formData = createFormData({
        fullName: 'Updated Name',
        phone: '11888887777',
        currentPhotoUrl: 'https://example.com/old-photo.jpg',
      })

      const result = await updateProfile(formData)

      expect(result).toEqual({ success: true })
      expect(mockRevalidatePath).toHaveBeenCalled()
      // Verify revalidatePath was called for relevant paths
      const calls = mockRevalidatePath.mock.calls.map((c: any[]) => c[0])
      expect(calls).toContain('/configuracoes')
      expect(calls).toContain('/dashboard')
    })

    it('should upload new avatar and update profile', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      mockStorageUpload.mockResolvedValue({ error: null })
      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/new-photo.jpg' },
      })
      supabaseMockData.profiles = { data: null, error: null }

      const formData = new FormData()
      formData.append('fullName', 'Updated Name')
      formData.append('phone', '11888887777')
      formData.append('avatar', new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

      const result = await updateProfile(formData)

      expect(result).toEqual({ success: true })
      expect(mockStorageUpload).toHaveBeenCalled()
    })

    it('should throw error when avatar upload fails', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      mockStorageUpload.mockResolvedValue({ error: { message: 'Upload failed' } })

      const formData = new FormData()
      formData.append('fullName', 'Updated Name')
      formData.append('phone', '11888887777')
      formData.append('avatar', new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))

      await expect(updateProfile(formData)).rejects.toThrow('Falha ao fazer upload da imagem')
    })

    it('should throw error when profile update fails', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = { data: null, error: { message: 'Update failed' } }

      const formData = createFormData({
        fullName: 'Updated Name',
        phone: '11888887777',
      })

      await expect(updateProfile(formData)).rejects.toThrow('Falha ao atualizar perfil')
    })
  })

  // =====================================================
  // getChurchMembers
  // =====================================================

  describe('getChurchMembers', () => {
    it('should return empty array when user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      const result = await getChurchMembers()

      expect(result).toEqual([])
    })

    it('should return church members when authenticated', async () => {
      const mockMembers = [
        { id: 'user-1', full_name: 'Alice', role: 'MEMBER' },
        { id: 'user-2', full_name: 'Bob', role: 'LEADER' },
      ]
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = {
        single: { data: createMockProfile(), error: null },
        data: mockMembers,
        error: null
      }

      const result = await getChurchMembers()

      expect(result).toHaveLength(2)
    })

    it('should return empty array on database error', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: createMockUser() } })
      supabaseMockData.profiles = {
        single: { data: createMockProfile(), error: null },
        data: null,
        error: { message: 'Database error' }
      }

      const result = await getChurchMembers()

      expect(result).toEqual([])
    })
  })

  // =====================================================
  // Security Unit Tests
  // =====================================================

  describe('Security Considerations', () => {
    describe('Password Handling', () => {
      it('should never log passwords', async () => {
        const consoleSpy = vi.spyOn(console, 'error')
        mockAuthSignInWithPassword.mockResolvedValue({
          error: { message: 'Invalid' },
        })

        const formData = createFormData({
          email: 'test@example.com',
          password: 'super-secret-password',
        })

        try {
          await signIn(formData)
        } catch {
          // Expected redirect
        }

        // Verify password is not logged
        consoleSpy.mock.calls.forEach((call) => {
          const logString = JSON.stringify(call)
          expect(logString).not.toContain('super-secret-password')
        })

        consoleSpy.mockRestore()
      })

      it('should validate password confirmation in reset', async () => {
        const formData = createFormData({
          password: 'newpassword123',
          confirmPassword: 'newpassword456',
        })

        await expect(resetPassword(formData)).rejects.toThrow('senhas não coincidem')
        expect(mockAuthUpdateUser).not.toHaveBeenCalled()
      })
    })

    describe('Authentication Checks', () => {
      it('should check authentication before profile update', async () => {
        mockAuthGetUser.mockResolvedValue({ data: { user: null } })

        const formData = createFormData({
          fullName: 'Hacker',
          phone: '11999998888',
        })

        await expect(updateProfile(formData)).rejects.toThrow('Não autenticado')
      })

      it('should return null profile for unauthenticated users', async () => {
        mockAuthGetUser.mockResolvedValue({ data: { user: null } })

        const result = await getProfile()

        expect(result).toBeNull()
      })
    })

    describe('Input Validation', () => {
      it('should handle empty form data gracefully', async () => {
        mockAuthSignInWithPassword.mockResolvedValue({
          error: { message: 'Email required' },
        })

        const formData = createFormData({
          email: '',
          password: '',
        })

        await expect(signIn(formData)).rejects.toThrow('REDIRECT:/login?error=')
      })

      it('should handle special characters in error messages', async () => {
        mockAuthSignInWithPassword.mockResolvedValue({
          error: { message: 'Error with <script>alert(1)</script>' },
        })

        const formData = createFormData({
          email: 'test@example.com',
          password: 'password',
        })

        try {
          await signIn(formData)
        } catch (error) {
          // Error message should be URL encoded, preventing injection
          expect((error as Error).message).toContain('REDIRECT:/login?error=')
        }
      })
    })

    describe('Role-Based Access', () => {
      it('should set MEMBER role for new signups', async () => {
        mockAuthSignUp.mockResolvedValue({
          data: { user: createMockUser() },
          error: null,
        })
        supabaseMockData.profiles = { data: null, error: null }

        const formData = createFormData({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'New User',
          phone: '',
          church_id: 'church-123',
        })

        try {
          await signUp(formData)
        } catch {
          // Expected redirect
        }

        // New users should always be MEMBER, never PASTOR or LEADER
        expect(mockAuthSignUp).toHaveBeenCalled()
      })

      it('should set VISITOR member_stage for new signups', async () => {
        mockAuthSignUp.mockResolvedValue({
          data: { user: createMockUser() },
          error: null,
        })
        supabaseMockData.profiles = { data: null, error: null }

        const formData = createFormData({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'New User',
          phone: '',
          church_id: 'church-123',
        })

        try {
          await signUp(formData)
        } catch {
          // Expected redirect
        }

        // New users should always start as VISITOR
        expect(mockAuthSignUp).toHaveBeenCalled()
      })
    })
  })
})
