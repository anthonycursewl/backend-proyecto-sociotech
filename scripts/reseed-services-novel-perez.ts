import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DOCTOR_USER_ID = 'd6d8ca51-5a59-481c-9555-dff997616fed';

interface ServiceSeed {
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

const SERVICES: ServiceSeed[] = [
  { name: 'Consulta General con Dr. Novel Perez', description: 'Evaluación médica integral con el Dr. Novel Perez para diagnóstico y tratamiento de enfermedades comunes.', durationMin: 30, price: 800 },
  { name: 'Medicina Interna - Dr. Novel Perez', description: 'Atención especializada en enfermedades del adulto con enfoque preventivo y terapéutico.', durationMin: 45, price: 1200 },
  { name: 'Pediatría con Dr. Novel Perez', description: 'Atención médica para niños y adolescentes desde el nacimiento hasta los 18 años.', durationMin: 30, price: 900 },
  { name: 'Ginecología - Dr. Novel Perez', description: 'Atención integral de la salud femenina, control prenatal y planificación familiar.', durationMin: 45, price: 1100 },
  { name: 'Cardiología con Dr. Novel Perez', description: 'Diagnóstico y tratamiento de enfermedades del corazón y sistema circulatorio.', durationMin: 45, price: 1500 },
  { name: 'Dermatología - Dr. Novel Perez', description: 'Diagnóstico y tratamiento de enfermedades de la piel, cabello y uñas.', durationMin: 30, price: 1000 },
  { name: 'Traumatología con Dr. Novel Perez', description: 'Atención de lesiones del sistema musculoesquelético, fracturas y problemas articulares.', durationMin: 45, price: 1300 },
  { name: 'Neurología - Dr. Novel Perez', description: 'Diagnóstico y tratamiento de trastornos del sistema nervioso central y periférico.', durationMin: 60, price: 1800 },
  { name: 'Oftalmología con Dr. Novel Perez', description: 'Evaluación y tratamiento de enfermedades oculares y trastornos de la visión.', durationMin: 30, price: 1000 },
  { name: 'Otorrinolaringología - Dr. Novel Perez', description: 'Atención de enfermedades del oído, nariz y garganta.', durationMin: 30, price: 1000 },
  { name: 'Urología con Dr. Novel Perez', description: 'Diagnóstico y tratamiento de enfermedades del aparato urinario y sistema reproductor masculino.', durationMin: 45, price: 1200 },
  { name: 'Gastroenterología - Dr. Novel Perez', description: 'Evaluación y tratamiento de enfermedades del aparato digestivo.', durationMin: 45, price: 1400 },
  { name: 'Endocrinología con Dr. Novel Perez', description: 'Diagnóstico y tratamiento de trastornos hormonales y metabólicos como diabetes y tiroides.', durationMin: 45, price: 1300 },
  { name: 'Neumología - Dr. Novel Perez', description: 'Atención especializada en enfermedades respiratorias y pulmonares.', durationMin: 45, price: 1300 },
  { name: 'Reumatología con Dr. Novel Perez', description: 'Diagnóstico y tratamiento de enfermedades autoinmunes y reumáticas.', durationMin: 45, price: 1400 },
  { name: 'Nefrología - Dr. Novel Perez', description: 'Evaluación y tratamiento de enfermedades renales y trastornos de electrolitos.', durationMin: 45, price: 1500 },
  { name: 'Hematología con Dr. Novel Perez', description: 'Diagnóstico y tratamiento de enfermedades de la sangre y médula ósea.', durationMin: 45, price: 1400 },
  { name: 'Psiquiatría - Dr. Novel Perez', description: 'Diagnóstico y tratamiento de trastornos mentales y emocionales.', durationMin: 60, price: 1500 },
  { name: 'Psicología Clínica con Dr. Novel Perez', description: 'Terapia psicológica para el manejo de ansiedad, depresión y otros trastornos emocionales.', durationMin: 60, price: 1000 },
  { name: 'Nutrición - Dr. Novel Perez', description: 'Asesoría nutricional personalizada para el control de peso y enfermedades metabólicas.', durationMin: 45, price: 700 },
  { name: 'Fisioterapia con Dr. Novel Perez', description: 'Terapia física para recuperación de lesiones musculares y articulares.', durationMin: 45, price: 600 },
  { name: 'Medicina del Deporte - Dr. Novel Perez', description: 'Evaluación y tratamiento de lesiones deportivas y optimización del rendimiento físico.', durationMin: 45, price: 1000 },
  { name: 'Medicina Estética con Dr. Novel Perez', description: 'Procedimientos estéticos no invasivos como botox, ácido hialurónico y rejuvenecimiento facial.', durationMin: 60, price: 2500 },
  { name: 'Electrocardiograma (ECG) - Dr. Novel Perez', description: 'Registro gráfico de la actividad eléctrica del corazón para detectar anomalías cardíacas.', durationMin: 20, price: 500 },
  { name: 'Espirometría con Dr. Novel Perez', description: 'Prueba de función pulmonar para evaluar la capacidad respiratoria.', durationMin: 30, price: 600 },
  { name: 'Audiometría - Dr. Novel Perez', description: 'Evaluación de la capacidad auditiva para detectar pérdidas de audición.', durationMin: 30, price: 700 },
  { name: 'Ecografía General con Dr. Novel Perez', description: 'Imagen diagnóstica por ultrasonido de abdomen, pelvis y partes blandas.', durationMin: 30, price: 1200 },
  { name: 'Ecografía Doppler - Dr. Novel Perez', description: 'Estudio de flujo sanguíneo mediante ultrasonido Doppler para evaluar circulación.', durationMin: 45, price: 1800 },
  { name: 'Laboratorio Clínico Básico con Dr. Novel Perez', description: 'Análisis de sangre completo incluyendo biometría hemática, química sanguínea y examen general de orina.', durationMin: 15, price: 400 },
  { name: 'Control de Embarazo - Dr. Novel Perez', description: 'Seguimiento médico mensual del embarazo incluyendo ecografía obstétrica.', durationMin: 30, price: 800 },
];

async function reseedServices() {
  console.log('\n========================================');
  console.log('   Re-seed Services - Dr. Novel Perez');
  console.log('========================================\n');

  const doctor = await prisma.doctor.findFirst({
    where: { userId: DOCTOR_USER_ID },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  if (!doctor) {
    console.error(`Doctor with userId ${DOCTOR_USER_ID} not found.`);
    process.exit(1);
  }

  const DOCTOR_ID = doctor.id;

  console.log(`Doctor found: ${doctor.user.firstName} ${doctor.user.lastName} (${doctor.user.email})`);
  console.log(`Specialty: ${doctor.specialty}\n`);

  const existingCount = await prisma.service.count();
  console.log(`Existing services in DB: ${existingCount}`);

  if (existingCount > 0) {
    console.log('Deleting all existing services (cascades to appointments)...');
    const deleted = await prisma.service.deleteMany({});
    console.log(`  - Deleted ${deleted.count} services\n`);
  }

  let created = 0;
  let skipped = 0;

  for (const svc of SERVICES) {
    const existing = await prisma.service.findUnique({ where: { name: svc.name } });
    if (existing) {
      console.log(`  ~ ${svc.name} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.service.create({
      data: {
        name: svc.name,
        description: svc.description,
        durationMin: svc.durationMin,
        price: svc.price,
        isActive: true,
        createdBy: doctor.user.id,
        doctors: {
          connect: { id: DOCTOR_ID },
        },
      },
    });
    console.log(`  + ${svc.name} - ${svc.durationMin}min - $${svc.price}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
  const finalDoctor = await prisma.doctor.findUnique({
    where: { id: DOCTOR_ID },
    include: { _count: { select: { services: true } } },
  });
  console.log(`Total services for Dr. Novel Perez: ${finalDoctor?._count.services ?? 0}`);
}

reseedServices()
  .catch((err) => {
    console.error('Re-seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
