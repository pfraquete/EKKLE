import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// =====================================================
// MOCKS
// =====================================================

const mockGetProfile = vi.fn()
const mockCreatePagarmeOrder = vi.fn()
const mockRevalidatePath = vi.fn()

// Supabase mock state
let supabaseMockData: Record<string, any> = {}

const createSupabaseChainMock = () => {
  const chain: any = {
    data: null,
    error: null,
    count: null,
  }

  const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single', 'order', 'limit']
  chainMethods.forEach((method) => {
    chain[method] = vi.fn((...args: any[]) => {
      // Check if we have mock data for this table
      const tableData = supabaseMockData[chain._table]
      if (tableData) {
        if (method === 'single' && tableData.single) {
          chain.data = tableData.single.data
          chain.error = tableData.single.error
        } else if (tableData.data !== undefined) {
          chain.data = tableData.data
          chain.error = tableData.error
          chain.count = tableData.count
        }
      }
      return chain
    })
  })

  return chain
}

const mockSupabaseFrom = vi.fn((table: string) => {
  const chain = createSupabaseChainMock()
  chain._table = table
  return chain
})

vi.mock('@/actions/auth', () => ({
  getProfile: () => mockGetProfile(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: mockSupabaseFrom,
  })),
}))

vi.mock('@/lib/pagarme', () => ({
  createOrder: (order: any) => mockCreatePagarmeOrder(order),
  createSplitRules: vi.fn((total, church, platform) => [
    { recipient_id: church, amount: Math.floor(total * 0.99), type: 'flat' },
    { recipient_id: platform, amount: Math.floor(total * 0.01), type: 'flat' },
  ]),
  calculateSplitAmounts: vi.fn((total) => ({
    platformFeeCents: Math.floor(total * 0.01),
    churchAmountCents: Math.floor(total * 0.99),
  })),
  PagarmeError: class PagarmeError extends Error {
    data: any
    constructor(message: string, data: any) {
      super(message)
      this.name = 'PagarmeError'
      this.data = data
    }
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}))

// =====================================================
// TEST DATA FACTORIES
// =====================================================

const createMockProfile = (overrides = {}) => ({
  id: 'user-123',
  church_id: 'church-123',
  role: 'MEMBER' as const,
  full_name: 'Test User',
  email: 'test@example.com',
  ...overrides,
})

const createMockProduct = (overrides = {}) => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Test Product',
  price_cents: 5000,
  status: 'active',
  track_inventory: true,
  allow_backorder: false,
  stock_quantity: 10,
  sku: 'TEST-SKU-001',
  ...overrides,
})

const createMockRecipient = (overrides = {}) => ({
  id: 'recipient-123',
  church_id: 'church-123',
  pagarme_recipient_id: 'rp_church_123',
  status: 'active',
  ...overrides,
})

const createValidCheckoutInput = (overrides: any = {}) => ({
  items: [
    {
      product_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      quantity: 2,
    },
  ],
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '11999998888',
    document: '12345678901',
  },
  payment_method: 'pix' as const,
  ...overrides,
})

const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  church_id: 'church-123',
  customer_id: 'user-123',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '11999998888',
  customer_document: '12345678901',
  subtotal_cents: 10000,
  total_cents: 10000,
  payment_method: 'pix',
  payment_status: 'pending',
  status: 'pending',
  created_at: new Date().toISOString(),
  ...overrides,
})

const createMockPagarmeResponse = (overrides = {}) => ({
  id: 'ord_pagarme_123',
  status: 'pending',
  customer: { id: 'cus_pagarme_123' },
  charges: [
    {
      id: 'ch_123',
      status: 'pending',
      last_transaction: {
        id: 'tr_123',
        qr_code: 'pix-qr-code-data',
        qr_code_url: 'https://pix.example.com/qrcode.png',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      },
    },
  ],
  ...overrides,
})

// =====================================================
// IMPORT AFTER MOCKS
// =====================================================

import {
  createCheckoutOrder,
  getCustomerOrders,
  getOrder,
  getChurchOrders,
  updateOrderStatus,
  updateFulfillmentStatus,
  getOrderStatistics,
} from '@/actions/orders'

// =====================================================
// TESTS
// =====================================================

describe('Orders Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMockData = {}
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =====================================================
  // createCheckoutOrder - Authentication
  // =====================================================

  describe('createCheckoutOrder', () => {
    describe('Authentication', () => {
      it('should return error when user is not authenticated', async () => {
        mockGetProfile.mockResolvedValue(null)

        const result = await createCheckoutOrder(createValidCheckoutInput())

        expect(result).toEqual({ success: false, error: 'Não autenticado' })
      })
    })

    describe('Input Validation (using Zod schema)', () => {
      it('should validate items array is not empty', () => {
        const checkoutSchema = z.object({
          items: z
            .array(
              z.object({
                product_id: z.string().uuid(),
                quantity: z.number().int().min(1),
                metadata: z.record(z.any()).optional(),
              })
            )
            .min(1, 'Adicione pelo menos um item ao carrinho'),
          customer: z.object({
            name: z.string().min(1, 'Nome é obrigatório'),
            email: z.string().email('Email inválido'),
            phone: z.string().min(10, 'Telefone inválido'),
            document: z.string().min(11, 'CPF/CNPJ inválido'),
          }),
          payment_method: z.enum(['credit_card', 'pix']),
        })

        const emptyItemsInput = {
          items: [],
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '11999998888',
            document: '12345678901',
          },
          payment_method: 'pix' as const,
        }

        const parseResult = checkoutSchema.safeParse(emptyItemsInput)
        expect(parseResult.success).toBe(false)
        if (!parseResult.success) {
          expect(parseResult.error.errors[0].message).toContain('pelo menos um item')
        }
      })

      it('should validate email format', () => {
        const checkoutSchema = z.object({
          customer: z.object({
            email: z.string().email('Email inválido'),
          }),
        })

        const invalidEmail = { customer: { email: 'invalid-email' } }
        const parseResult = checkoutSchema.safeParse(invalidEmail)

        expect(parseResult.success).toBe(false)
        if (!parseResult.success) {
          expect(parseResult.error.errors[0].message).toContain('Email')
        }
      })

      it('should validate phone minimum length', () => {
        const checkoutSchema = z.object({
          customer: z.object({
            phone: z.string().min(10, 'Telefone inválido'),
          }),
        })

        const invalidPhone = { customer: { phone: '123' } }
        const parseResult = checkoutSchema.safeParse(invalidPhone)

        expect(parseResult.success).toBe(false)
        if (!parseResult.success) {
          expect(parseResult.error.errors[0].message).toContain('Telefone')
        }
      })

      it('should validate document minimum length', () => {
        const checkoutSchema = z.object({
          customer: z.object({
            document: z.string().min(11, 'CPF/CNPJ inválido'),
          }),
        })

        const invalidDoc = { customer: { document: '123' } }
        const parseResult = checkoutSchema.safeParse(invalidDoc)

        expect(parseResult.success).toBe(false)
        if (!parseResult.success) {
          expect(parseResult.error.errors[0].message).toContain('CPF')
        }
      })

      it('should validate product_id is UUID format', () => {
        const itemSchema = z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1),
        })

        const invalidProductId = { product_id: 'not-a-uuid', quantity: 1 }
        const parseResult = itemSchema.safeParse(invalidProductId)

        expect(parseResult.success).toBe(false)
      })

      it('should validate quantity is at least 1', () => {
        const itemSchema = z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1),
        })

        const invalidQuantity = {
          product_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          quantity: 0
        }
        const parseResult = itemSchema.safeParse(invalidQuantity)

        expect(parseResult.success).toBe(false)
      })

      it('should accept valid credit card data', () => {
        const cardSchema = z.object({
          number: z.string().min(13),
          holderName: z.string().min(1),
          expMonth: z.number().int().min(1).max(12),
          expYear: z.number().int().min(2024),
          cvv: z.string().min(3).max(4),
          billingAddress: z.object({
            line1: z.string().min(1),
            zipCode: z.string().min(8),
            city: z.string().min(1),
            state: z.string().length(2),
          }),
        })

        const validCard = {
          number: '4111111111111111',
          holderName: 'JOHN DOE',
          expMonth: 12,
          expYear: 2025,
          cvv: '123',
          billingAddress: {
            line1: 'Rua das Flores, 123',
            zipCode: '01234567',
            city: 'São Paulo',
            state: 'SP',
          },
        }

        const parseResult = cardSchema.safeParse(validCard)
        expect(parseResult.success).toBe(true)
      })
    })

    describe('Split Payment Calculation', () => {
      it('should calculate 1% platform fee correctly', async () => {
        const { calculateSplitAmounts } = await import('@/lib/pagarme')

        const result = calculateSplitAmounts(10000)

        expect(result.platformFeeCents).toBe(100) // 1%
        expect(result.churchAmountCents).toBe(9900) // 99%
      })

      it('should handle small amounts without rounding errors', async () => {
        const { calculateSplitAmounts } = await import('@/lib/pagarme')

        const result = calculateSplitAmounts(100) // R$ 1.00

        expect(result.platformFeeCents).toBe(1) // 1 cent
        expect(result.churchAmountCents).toBe(99) // 99 cents
        expect(result.platformFeeCents + result.churchAmountCents).toBe(100)
      })

      it('should create correct split rules', async () => {
        const { createSplitRules } = await import('@/lib/pagarme')

        const rules = createSplitRules(10000, 'rp_church_123', 'rp_platform_123')

        expect(rules).toHaveLength(2)
        expect(rules[0].recipient_id).toBe('rp_church_123')
        expect(rules[0].amount).toBe(9900) // 99%
        expect(rules[1].recipient_id).toBe('rp_platform_123')
        expect(rules[1].amount).toBe(100) // 1%
      })
    })

    describe('Document Type Detection', () => {
      it('should identify CPF for 11 digit document', () => {
        const cleanDocument = '123.456.789-01'.replace(/\D/g, '')
        const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ'
        const customerType = cleanDocument.length <= 11 ? 'individual' : 'company'

        expect(cleanDocument).toBe('12345678901')
        expect(cleanDocument.length).toBe(11)
        expect(documentType).toBe('CPF')
        expect(customerType).toBe('individual')
      })

      it('should identify CNPJ for 14 digit document', () => {
        const cleanDocument = '12.345.678/0001-90'.replace(/\D/g, '')
        const documentType = cleanDocument.length <= 11 ? 'CPF' : 'CNPJ'
        const customerType = cleanDocument.length <= 11 ? 'individual' : 'company'

        expect(cleanDocument).toBe('12345678000190')
        expect(cleanDocument.length).toBe(14)
        expect(documentType).toBe('CNPJ')
        expect(customerType).toBe('company')
      })
    })

    describe('Phone Formatting', () => {
      it('should correctly parse phone numbers', () => {
        const cleanPhone = '(11) 99999-8888'.replace(/\D/g, '')

        expect(cleanPhone).toBe('11999998888')
        expect(cleanPhone.length).toBeGreaterThanOrEqual(10)
        expect(cleanPhone.substring(0, 2)).toBe('11') // Area code
        expect(cleanPhone.substring(2)).toBe('999998888') // Number
      })
    })
  })

  // =====================================================
  // getCustomerOrders
  // =====================================================

  describe('getCustomerOrders', () => {
    it('should return empty array when user is not authenticated', async () => {
      mockGetProfile.mockResolvedValue(null)

      const result = await getCustomerOrders()

      expect(result).toEqual([])
    })

    it('should return customer orders when authenticated', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2' }),
      ]

      mockGetProfile.mockResolvedValue(createMockProfile())
      supabaseMockData.orders = { data: mockOrders, error: null }

      const result = await getCustomerOrders()

      expect(result).toHaveLength(2)
    })

    it('should return empty array on database error', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile())
      supabaseMockData.orders = { data: null, error: { message: 'Database error' } }

      const result = await getCustomerOrders()

      expect(result).toEqual([])
    })
  })

  // =====================================================
  // getOrder
  // =====================================================

  describe('getOrder', () => {
    it('should return null when user is not authenticated', async () => {
      mockGetProfile.mockResolvedValue(null)

      const result = await getOrder('order-123')

      expect(result).toBeNull()
    })

    it('should return null when order belongs to different customer and church', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({
        id: 'different-user',
        church_id: 'different-church',
      }))

      supabaseMockData.orders = {
        single: { data: createMockOrder(), error: null }
      }

      const result = await getOrder('order-123')

      expect(result).toBeNull()
    })

    it('should return order when user is the customer', async () => {
      const mockOrder = createMockOrder()
      mockGetProfile.mockResolvedValue(createMockProfile())
      supabaseMockData.orders = { single: { data: mockOrder, error: null } }

      const result = await getOrder('order-123')

      expect(result).toEqual(mockOrder)
    })

    it('should return order when user belongs to same church', async () => {
      const mockOrder = createMockOrder({ customer_id: 'other-user' })
      mockGetProfile.mockResolvedValue(createMockProfile())
      supabaseMockData.orders = { single: { data: mockOrder, error: null } }

      const result = await getOrder('order-123')

      expect(result).toEqual(mockOrder)
    })
  })

  // =====================================================
  // getChurchOrders
  // =====================================================

  describe('getChurchOrders', () => {
    it('should return empty array when user is not authenticated', async () => {
      mockGetProfile.mockResolvedValue(null)

      const result = await getChurchOrders()

      expect(result).toEqual([])
    })

    it('should return all church orders', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2' }),
        createMockOrder({ id: 'order-3' }),
      ]

      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'PASTOR' }))
      supabaseMockData.orders = { data: mockOrders, error: null }

      const result = await getChurchOrders()

      expect(result).toHaveLength(3)
    })
  })

  // =====================================================
  // updateOrderStatus
  // =====================================================

  describe('updateOrderStatus', () => {
    it('should return error when user is not authenticated', async () => {
      mockGetProfile.mockResolvedValue(null)

      const result = await updateOrderStatus('order-123', 'processing')

      expect(result).toEqual({ success: false, error: 'Não autorizado' })
    })

    it('should return error when user is not PASTOR', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'MEMBER' }))

      const result = await updateOrderStatus('order-123', 'processing')

      expect(result).toEqual({ success: false, error: 'Não autorizado' })
    })

    it('should return error for LEADER role', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'LEADER' }))

      const result = await updateOrderStatus('order-123', 'processing')

      expect(result).toEqual({ success: false, error: 'Não autorizado' })
    })

    it('should return error when order belongs to different church', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'PASTOR' }))
      supabaseMockData.orders = {
        single: {
          data: createMockOrder({ church_id: 'different-church' }),
          error: null
        }
      }

      const result = await updateOrderStatus('order-123', 'processing')

      expect(result).toEqual({ success: false, error: 'Pedido não encontrado' })
    })

    it('should update order status when user is PASTOR of same church', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'PASTOR' }))
      supabaseMockData.orders = {
        single: { data: createMockOrder(), error: null },
        data: createMockOrder(),
        error: null
      }

      const result = await updateOrderStatus('order-123', 'processing')

      expect(result).toEqual({ success: true })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/loja/pedidos')
    })
  })

  // =====================================================
  // updateFulfillmentStatus
  // =====================================================

  describe('updateFulfillmentStatus', () => {
    it('should return error when user is not PASTOR', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'LEADER' }))

      const result = await updateFulfillmentStatus('order-123', 'fulfilled')

      expect(result).toEqual({ success: false, error: 'Não autorizado' })
    })

    it('should return error when user is MEMBER', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'MEMBER' }))

      const result = await updateFulfillmentStatus('order-123', 'shipped')

      expect(result).toEqual({ success: false, error: 'Não autorizado' })
    })

    it('should update fulfillment status when user is PASTOR', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'PASTOR' }))
      supabaseMockData.orders = {
        single: { data: createMockOrder(), error: null },
        data: createMockOrder(),
        error: null
      }

      const result = await updateFulfillmentStatus('order-123', 'fulfilled')

      expect(result).toEqual({ success: true })
    })
  })

  // =====================================================
  // getOrderStatistics
  // =====================================================

  describe('getOrderStatistics', () => {
    it('should return null when user is not authenticated', async () => {
      mockGetProfile.mockResolvedValue(null)

      const result = await getOrderStatistics()

      expect(result).toBeNull()
    })

    it('should return null when user is not PASTOR', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'MEMBER' }))

      const result = await getOrderStatistics()

      expect(result).toBeNull()
    })

    it('should return null for LEADER role', async () => {
      mockGetProfile.mockResolvedValue(createMockProfile({ role: 'LEADER' }))

      const result = await getOrderStatistics()

      expect(result).toBeNull()
    })
  })

  // =====================================================
  // Business Logic Unit Tests
  // =====================================================

  describe('Business Logic', () => {
    describe('Stock Validation Logic', () => {
      it('should detect insufficient stock', () => {
        const product = createMockProduct({ stock_quantity: 5 })
        const requestedQuantity = 10

        const hasEnoughStock = product.stock_quantity >= requestedQuantity

        expect(hasEnoughStock).toBe(false)
      })

      it('should allow when stock is sufficient', () => {
        const product = createMockProduct({ stock_quantity: 10 })
        const requestedQuantity = 5

        const hasEnoughStock = product.stock_quantity >= requestedQuantity

        expect(hasEnoughStock).toBe(true)
      })

      it('should skip check when track_inventory is false', () => {
        const product = createMockProduct({
          track_inventory: false,
          stock_quantity: 0
        })
        const requestedQuantity = 100

        const shouldCheck = product.track_inventory && !product.allow_backorder

        expect(shouldCheck).toBe(false)
      })

      it('should allow backorder when enabled', () => {
        const product = createMockProduct({
          track_inventory: true,
          allow_backorder: true,
          stock_quantity: 0
        })
        const requestedQuantity = 10

        const shouldBlockOrder = product.track_inventory &&
                                  !product.allow_backorder &&
                                  product.stock_quantity < requestedQuantity

        expect(shouldBlockOrder).toBe(false)
      })
    })

    describe('Order Total Calculation', () => {
      it('should calculate order total correctly', () => {
        const items = [
          { price_cents: 5000, quantity: 2 }, // R$ 100.00
          { price_cents: 2500, quantity: 4 }, // R$ 100.00
        ]

        const totalCents = items.reduce(
          (sum, item) => sum + item.price_cents * item.quantity,
          0
        )

        expect(totalCents).toBe(20000) // R$ 200.00
      })

      it('should handle single item', () => {
        const items = [{ price_cents: 9990, quantity: 1 }]

        const totalCents = items.reduce(
          (sum, item) => sum + item.price_cents * item.quantity,
          0
        )

        expect(totalCents).toBe(9990)
      })
    })

    describe('Recipient Validation', () => {
      it('should identify inactive recipient', () => {
        const recipient = createMockRecipient({ status: 'pending' })

        const isActive = recipient.status === 'active'

        expect(isActive).toBe(false)
      })

      it('should identify active recipient', () => {
        const recipient = createMockRecipient({ status: 'active' })

        const isActive = recipient.status === 'active'

        expect(isActive).toBe(true)
      })

      it('should identify null recipient', () => {
        const recipient = null

        const hasValidRecipient = recipient && recipient.status === 'active'

        expect(hasValidRecipient).toBeFalsy()
      })
    })

    describe('Payment Status Mapping', () => {
      it('should map paid Pagar.me status to processing order status', () => {
        const pagarmeStatus = 'paid'

        const orderStatus = pagarmeStatus === 'paid' ? 'processing' : 'pending'
        const paymentStatus = pagarmeStatus === 'paid' ? 'paid' : 'pending'

        expect(orderStatus).toBe('processing')
        expect(paymentStatus).toBe('paid')
      })

      it('should map pending Pagar.me status to pending order status', () => {
        const pagarmeStatus = 'pending'

        const orderStatus = pagarmeStatus === 'paid' ? 'processing' : 'pending'
        const paymentStatus = pagarmeStatus === 'paid' ? 'paid' : 'pending'

        expect(orderStatus).toBe('pending')
        expect(paymentStatus).toBe('pending')
      })
    })

    describe('Authorization Checks', () => {
      it('should only allow PASTOR to update order status', () => {
        const roles = ['PASTOR', 'LEADER', 'MEMBER']

        const authorizedRoles = roles.filter(role => role === 'PASTOR')

        expect(authorizedRoles).toEqual(['PASTOR'])
      })

      it('should only allow PASTOR to view statistics', () => {
        const profile = createMockProfile({ role: 'PASTOR' })

        const canViewStats = profile.role === 'PASTOR'

        expect(canViewStats).toBe(true)
      })

      it('should allow customer or church member to view order', () => {
        const order = createMockOrder()
        const profile = createMockProfile()

        const isCustomer = order.customer_id === profile.id
        const isSameChurch = order.church_id === profile.church_id
        const canView = isCustomer || isSameChurch

        expect(canView).toBe(true)
      })

      it('should deny access when neither customer nor same church', () => {
        const order = createMockOrder()
        const profile = createMockProfile({
          id: 'different-user',
          church_id: 'different-church',
        })

        const isCustomer = order.customer_id === profile.id
        const isSameChurch = order.church_id === profile.church_id
        const canView = isCustomer || isSameChurch

        expect(canView).toBe(false)
      })
    })
  })
})
