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

interface ServiceSeed {
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

const SERVICES: ServiceSeed[] = [
  { name: 'Consulta General', description: 'Evaluación médica integral para diagnóstico y tratamiento de enfermedades comunes.', durationMin: 30, price: 800 },
  { name: 'Medicina Interna', description: 'Atención especializada en enfermedades del adulto con enfoque preventivo y terapéutico.', durationMin: 45, price: 1200 },
  { name: 'Pediatría', description: 'Atención médica para niños y adolescentes desde el nacimiento hasta los 18 años.', durationMin: 30, price: 900 },
  { name: 'Ginecología y Obstetricia', description: 'Atención Integral de la salud femenina, control prenatal y planificación familiar.', durationMin: 45, price: 1100 },
  { name: 'Cardiología', description: 'Diagnóstico y tratamiento de enfermedades del corazón y sistema circulatorio.', durationMin: 45, price: 1500 },
  { name: 'Dermatología', description: 'Diagnóstico y tratamiento de enfermedades de la piel, cabello y uñas.', durationMin: 30, price: 1000 },
  { name: 'Traumatología y Ortopedia', description: 'Atención de lesiones del sistema musculoesquelético, fracturas y problemas articulares.', durationMin: 45, price: 1300 },
  { name: 'Neurología', description: 'Diagnóstico y tratamiento de trastornos del sistema nervioso central y periférico.', durationMin: 60, price: 1800 },
  { name: 'Oftalmología', description: 'Evaluación y tratamiento de enfermedades oculares y trastornos de la visión.', durationMin: 30, price: 1000 },
  { name: 'Otorrinolaringología', description: 'Atención de enfermedades del oído, nariz y garganta.', durationMin: 30, price: 1000 },
  { name: 'Urología', description: 'Diagnóstico y tratamiento de enfermedades del aparato urinario y sistema reproductor masculino.', durationMin: 45, price: 1200 },
  { name: 'Gastroenterología', description: 'Evaluación y tratamiento de enfermedades del aparato digestivo.', durationMin: 45, price: 1400 },
  { name: 'Endocrinología', description: 'Diagnóstico y tratamiento de trastornos hormonales y metabólicos como diabetes y tiroides.', durationMin: 45, price: 1300 },
  { name: 'Neumología', description: 'Atención especializada en enfermedades respiratorias y pulmonares.', durationMin: 45, price: 1300 },
  { name: 'Reumatología', description: 'Diagnóstico y tratamiento de enfermedades autoinmunes y reumáticas.', durationMin: 45, price: 1400 },
  { name: 'Nefrología', description: 'Evaluación y tratamiento de enfermedades renales y trastornos de electrolitos.', durationMin: 45, price: 1500 },
  { name: 'Hematología', description: 'Diagnóstico y tratamiento de enfermedades de la sangre y médula ósea.', durationMin: 45, price: 1400 },
  { name: 'Psiquiatría', description: 'Diagnóstico y tratamiento de trastornos mentales y emocionales.', durationMin: 60, price: 1500 },
  { name: 'Psicología Clínica', description: 'Terapia psicológica para el manejo de ansiedad, depresión y otros trastornos emocionales.', durationMin: 60, price: 1000 },
  { name: 'Nutrición y Dietética', description: 'Asesoría nutricional personalizada para el control de peso y enfermedades metabólicas.', durationMin: 45, price: 700 },
  { name: 'Fisioterapia y Rehabilitación', description: 'Terapia física para recuperación de lesiones musculares y articulares.', durationMin: 45, price: 600 },
  { name: 'Medicina del Deporte', description: 'Evaluación y tratamiento de lesiones deportivas y optimización del rendimiento físico.', durationMin: 45, price: 1000 },
  { name: 'Medicina Estética', description: 'Procedimientos estéticos no invasivos como botox, ácido hialurónico y rejuvenecimiento facial.', durationMin: 60, price: 2500 },
  { name: 'Electrocardiograma (ECG)', description: 'Registro gráfico de la actividad eléctrica del corazón para detectar anomalías cardíacas.', durationMin: 20, price: 500 },
  { name: 'Electroencefalograma (EEG)', description: 'Registro de la actividad eléctrica cerebral para diagnosticar epilepsia y otros trastornos neurológicos.', durationMin: 60, price: 1500 },
  { name: 'Espirometría', description: 'Prueba de función pulmonar para evaluar la capacidad respiratoria.', durationMin: 30, price: 600 },
  { name: 'Audiometría', description: 'Evaluación de la capacidad auditiva para detectar pérdidas de audición.', durationMin: 30, price: 700 },
  { name: 'Prueba de Esfuerzo', description: 'Evaluación cardiovascular bajo esfuerzo físico controlado en tapiz rodante.', durationMin: 60, price: 1800 },
  { name: 'Ecografía General', description: 'Imagen diagnóstica por ultrasonido de abdomen, pelvis y partes blandas.', durationMin: 30, price: 1200 },
  { name: 'Ecografía Doppler', description: 'Estudio de flujo sanguíneo mediante ultrasonido Doppler para evaluar circulación.', durationMin: 45, price: 1800 },
  { name: 'Mastografía Digital', description: 'Estudio de imagen para detección temprana de cáncer de mama.', durationMin: 20, price: 900 },
  { name: 'Densitometría Ósea', description: 'Medición de densidad mineral ósea para diagnóstico de osteoporosis.', durationMin: 20, price: 800 },
  { name: 'Colonoscopía', description: 'Examen endoscópico del colon para detección de pólipos y cáncer colorrectal.', durationMin: 60, price: 3500 },
  { name: 'Endoscopía Digestiva Alta', description: 'Examen endoscópico del esófago, estómago y duodeno para diagnosticar úlceras y gastritis.', durationMin: 45, price: 3000 },
  { name: 'Laboratorio Clínico Básico', description: 'Análisis de sangre completo incluyendo biometría hemática, química sanguínea y examen general de orina.', durationMin: 15, price: 400 },
  { name: 'Perfil Tiroideo', description: 'Evaluación hormonal de la glándula tiroides (TSH, T3, T4).', durationMin: 10, price: 550 },
  { name: 'Perfil Lipídico', description: 'Medición de colesterol total, HDL, LDL y triglicéridos para evaluar riesgo cardiovascular.', durationMin: 10, price: 450 },
  { name: 'Curas y Curaciones', description: 'Limpieza, desinfección y vendaje de heridas y úlceras.', durationMin: 20, price: 300 },
  { name: 'Aplicación de Inyecciones', description: 'Administración de medicamentos por vía intramuscular, subcutánea o intravenosa.', durationMin: 15, price: 200 },
  { name: 'Toma de Muestras', description: 'Extracción de muestras sanguíneas, de heces u orina para análisis de laboratorio.', durationMin: 15, price: 150 },
  { name: 'Colocación de Yeso o Férula', description: 'Inmovilización de fracturas y lesiones óseas con yeso o material sintético.', durationMin: 30, price: 600 },
  { name: 'Retiro de Puntos', description: 'Extracción de suturas quirúrgicas después de la cicatrización de la herida.', durationMin: 15, price: 250 },
  { name: 'Limpieza Facial Profunda', description: 'Tratamiento estético facial para eliminar impurezas, puntos negros y células muertas.', durationMin: 45, price: 800 },
  { name: 'Consulta de Alergología', description: 'Evaluación y tratamiento de alergias respiratorias, cutáneas y alimentarias.', durationMin: 45, price: 1000 },
  { name: 'Consulta de Geriatría', description: 'Atención médica integral para adultos mayores con múltiples patologías.', durationMin: 45, price: 1100 },
  { name: 'Terapia Ocupacional', description: 'Rehabilitación para recuperar habilidades motoras finas y actividades de la vida diaria.', durationMin: 45, price: 600 },
  { name: 'Logopedia y Terapia de Lenguaje', description: 'Terapia para trastornos del habla, lenguaje y deglución.', durationMin: 45, price: 700 },
  { name: 'Control de Embarazo', description: 'Seguimiento médico mensual del embarazo incluyendo ecografía obstétrica.', durationMin: 30, price: 800 },
  { name: 'Colocación de DIU', description: 'Inserción del dispositivo intrauterino para anticoncepción de larga duración.', durationMin: 30, price: 1500 },
  { name: 'Planificación Familiar', description: 'Asesoría y prescripción de métodos anticonceptivos personalizados.', durationMin: 30, price: 500 },
];

async function seedServices() {
  console.log('\n========================================');
  console.log('   Services Seeder - 50 Medical Services');
  console.log('========================================\n');

  const adminUser = await prisma.user.findFirst({
    where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
    orderBy: { createdAt: 'asc' },
  });

  if (!adminUser) {
    console.error('No admin user found. Create one first with: npm run seed:admin');
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.email} (${adminUser.id})\n`);

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
        createdBy: adminUser.id,
      },
    });
    console.log(`  + ${svc.name} - ${svc.durationMin}min - $${svc.price}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

seedServices()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
