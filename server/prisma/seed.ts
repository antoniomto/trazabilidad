import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Users
  const adminHash = await bcrypt.hash('admin123', 12)
  const opHash = await bcrypt.hash('op123', 12)
  const supHash = await bcrypt.hash('sup123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@planta.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@planta.com', passwordHash: adminHash, role: 'ADMIN' },
  })
  await prisma.user.upsert({
    where: { email: 'operario@planta.com' },
    update: {},
    create: { name: 'Carlos López', email: 'operario@planta.com', passwordHash: opHash, role: 'OPERATOR' },
  })
  await prisma.user.upsert({
    where: { email: 'supervisor@planta.com' },
    update: {},
    create: { name: 'María García', email: 'supervisor@planta.com', passwordHash: supHash, role: 'SUPERVISOR' },
  })

  // Raw materials — catálogo de ejemplo
  const rawMaterialsData = [
    { name: 'Ingrediente Ejemplo',   unit: 'kg', supplier: 'Proveedor Demo SA' },
    { name: 'Sal de Mesa',           unit: 'kg', supplier: 'Salinera Nacional' },
    { name: 'Azúcar Estándar',       unit: 'kg', supplier: 'Ingenio Central' },
    { name: 'Harina de Trigo',       unit: 'kg', supplier: 'Molinos del Norte' },
    { name: 'Aceite Vegetal',        unit: 'L',  supplier: 'Aceites del Sur' },
    { name: 'Agua Purificada',       unit: 'L',  supplier: 'Planta Local' },
    { name: 'Conservador E-202',     unit: 'kg', supplier: 'Química Aliada' },
    { name: 'Colorante Natural',     unit: 'kg', supplier: 'Química Aliada' },
    { name: 'Emulsificante E-471',   unit: 'kg', supplier: 'Aditivos MX' },
  ]

  for (const rm of rawMaterialsData) {
    await prisma.rawMaterial.upsert({
      where: { id: (await prisma.rawMaterial.findFirst({ where: { name: rm.name } }))?.id ?? 'none' },
      update: {},
      create: rm,
    })
  }

  const rawMaterial = await prisma.rawMaterial.findFirst({ where: { name: 'Ingrediente Ejemplo' } })
  if (!rawMaterial) throw new Error('Seed: raw material not found')

  // Product
  let product = await prisma.product.findFirst({ where: { name: 'Producto Ejemplo' } })
  if (!product) {
    product = await prisma.product.create({
      data: { name: 'Producto Ejemplo', description: 'Producto para demostración del sistema de trazabilidad' },
    })
  }

  // Delete existing templates for clean seed
  await prisma.productPhaseTemplate.deleteMany({ where: { productId: product.id } })

  // Phase templates with expected params
  const phases = [
    {
      name: 'Recepción',
      orderIndex: 1,
      hasQualityCheck: false,
      maxDurationMin: 60,
      expectedParams: [
        { key: 'peso_kg', label: 'Peso recibido', unit: 'kg', min: 0 },
        { key: 'cl2_ppm', label: 'Concentración Cl₂', unit: 'ppm', min: 0.5, max: 2.0 },
        { key: 'temperatura_c', label: 'Temperatura', unit: '°C', min: 0, max: 10 },
      ],
    },
    {
      name: 'Lavado',
      orderIndex: 2,
      hasQualityCheck: false,
      maxDurationMin: 90,
      expectedParams: [
        { key: 'peso_ok_kg', label: 'Peso aceptado', unit: 'kg', min: 0 },
        { key: 'merma_kg', label: 'Merma', unit: 'kg', min: 0 },
        { key: 'num_cajas', label: 'Número de cajas', unit: 'cajas', min: 0 },
        { key: 'error_kg', label: 'Peso en error', unit: 'kg', min: 0 },
      ],
    },
    {
      name: 'Cámara Fría',
      orderIndex: 3,
      hasQualityCheck: false,
      maxDurationMin: 480,
      expectedParams: [
        { key: 'temp_camara_c', label: 'Temperatura cámara', unit: '°C', min: -2, max: 4 },
      ],
    },
    {
      name: 'Talemado',
      orderIndex: 4,
      hasQualityCheck: false,
      maxDurationMin: 120,
      expectedParams: [
        { key: 'merma_kg', label: 'Merma', unit: 'kg', min: 0 },
        { key: 'duracion_min', label: 'Duración', unit: 'min', min: 0 },
      ],
    },
    {
      name: 'Corte',
      orderIndex: 5,
      hasQualityCheck: false,
      maxDurationMin: 120,
      expectedParams: [
        { key: 'merma_kg', label: 'Merma', unit: 'kg', min: 0 },
        { key: 'duracion_min', label: 'Duración', unit: 'min', min: 0 },
      ],
    },
    {
      name: 'Pesar Polvos',
      orderIndex: 6,
      hasQualityCheck: false,
      maxDurationMin: 30,
      expectedParams: [
        { key: 'peso_polvos_kg', label: 'Peso de polvos', unit: 'kg', min: 0 },
      ],
    },
    {
      name: 'Cocción',
      orderIndex: 7,
      hasQualityCheck: true,
      maxDurationMin: 45,
      expectedParams: [
        { key: 'temperatura_c', label: 'Temperatura', unit: '°C', min: 70, max: 90 },
        { key: 'tiempo_coccion_min', label: 'Tiempo de cocción', unit: 'min', min: 14, max: 16 },
        { key: 'presion_bar', label: 'Presión', unit: 'bar', min: 0.8, max: 1.2 },
      ],
    },
    {
      name: 'Envasado',
      orderIndex: 8,
      hasQualityCheck: false,
      maxDurationMin: 60,
      expectedParams: [
        { key: 'num_piezas', label: 'Número de piezas', unit: 'pzas', min: 0 },
        { key: 'num_cantos', label: 'Número de cantos', unit: 'cantos', min: 0 },
        { key: 'peso_neto_kg', label: 'Peso neto', unit: 'kg', min: 0 },
      ],
    },
    {
      name: 'Etiquetado',
      orderIndex: 9,
      hasQualityCheck: false,
      maxDurationMin: 30,
      expectedParams: [
        { key: 'lote_final', label: 'Código de lote', unit: '', min: 0 },
        { key: 'num_etiquetas', label: 'Número de etiquetas', unit: 'pzas', min: 0 },
      ],
    },
  ]

  for (const phase of phases) {
    await prisma.productPhaseTemplate.create({
      data: {
        productId: product.id,
        name: phase.name,
        orderIndex: phase.orderIndex,
        hasQualityCheck: phase.hasQualityCheck,
        maxDurationMin: phase.maxDurationMin,
        expectedParams: phase.expectedParams as any,
      },
    })
  }

  console.log('✅ Seed completado')
  console.log('')
  console.log('👤 Usuarios de demo:')
  console.log('   admin@planta.com     / admin123  (Admin)')
  console.log('   operario@planta.com  / op123     (Operario)')
  console.log('   supervisor@planta.com / sup123   (Supervisor)')
  console.log('')
  console.log(`📦 Producto: ${product.name}`)
  console.log(`🧪 Materia prima: ${rawMaterial.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
