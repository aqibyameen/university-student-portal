/**
 * Prisma Seed — Development / Demo Data
 *
 * ⚠️  DEMO CREDENTIALS ONLY — never use in production.
 *
 * Admin    : admin@portal.edu          / ChangeMe123!
 * Staff IT : it.staff@portal.edu       / Staff123!
 * Staff Fin: finance.staff@portal.edu  / Staff123!
 * Staff Reg: registrar.staff@portal.edu / Staff123!
 * Students : CS-2026-001 … CS-2026-005  / Student123!
 */

import { PrismaClient, ApplicationType, OfficeType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(pw: string) {
  return argon2.hash(pw);
}

async function main() {
  console.log('🌱  Seeding database…');

  // ── Fee Configurations (demo values — not official UoK fees) ─────────────
  const feeConfigs: { applicationType: ApplicationType; office: OfficeType; baseFee: number; perSemesterFee: number }[] = [
    { applicationType: 'PROFORMA',   office: 'REGISTRAR_OFFICE', baseFee: 500,  perSemesterFee: 100 },
    { applicationType: 'PROFORMA',   office: 'SEMESTER_CELL',    baseFee: 300,  perSemesterFee: 80  },
    { applicationType: 'TRANSCRIPT', office: 'REGISTRAR_OFFICE', baseFee: 1000, perSemesterFee: 200 },
    { applicationType: 'TRANSCRIPT', office: 'SEMESTER_CELL',    baseFee: 800,  perSemesterFee: 150 },
  ];

  for (const fc of feeConfigs) {
    await prisma.feeConfiguration.upsert({
      where: { applicationType_office: { applicationType: fc.applicationType, office: fc.office } },
      update: { baseFee: fc.baseFee, perSemesterFee: fc.perSemesterFee },
      create: fc,
    });
  }
  console.log('  ✓ Fee configurations');

  // ── Departments ───────────────────────────────────────────────────────────
  const departments = [
    { name: 'Transport Office',               code: 'TRANSPORT',   description: 'Manages university bus routes and transport services.' },
    { name: 'Directorate of Finance',         code: 'FINANCE',     description: 'Handles fee payments, refunds, and financial matters.' },
    { name: 'Controller of Examinations',     code: 'EXAMS',       description: 'Manages examinations, results, and related queries.' },
    { name: 'Estate Office',                  code: 'ESTATE',      description: 'Handles campus maintenance, facilities, and infrastructure.' },
    { name: 'IT Department / Computer Centre',code: 'IT',          description: 'Provides IT services, WiFi, and lab support.' },
    { name: "Provost Office (Hostel)",        code: 'HOSTEL',      description: 'Manages hostel accommodation and facilities.' },
    { name: 'Dr. Mahmud Hussain Library',     code: 'LIBRARY',     description: 'Central university library services.' },
    { name: 'Campus Security Office',         code: 'SECURITY',    description: 'Ensures campus safety and handles security concerns.' },
    { name: "Registrar's Office",             code: 'REGISTRAR',   description: 'Handles official documents, proforma, and transcript requests.' },
    { name: 'Semester Cell',                  code: 'SEMESTER',    description: 'Processes semester-related applications and proforma.' },
    { name: "Office of the Students' Advisor",code: 'ADVISOR',     description: 'Provides guidance and handles general student complaints.' },
    { name: 'Academic Department',            code: 'ACADEMIC',    description: 'Handles academic issues, labs, and faculty-related complaints.' },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept,
    });
    deptMap[dept.code] = d.id;
  }
  console.log('  ✓ Departments');

  // ── Issues ────────────────────────────────────────────────────────────────
  const issueData: { code: string; issues: { name: string; description?: string }[] }[] = [
    {
      code: 'TRANSPORT',
      issues: [
        { name: 'Bus overcrowding', description: 'Bus is overcrowded and students cannot board.' },
        { name: 'Bus not available', description: 'Assigned bus did not arrive on schedule.' },
        { name: 'Evening service missing', description: 'Evening return bus service is unavailable.' },
        { name: 'Route issue', description: 'Bus route has been changed or is incorrect.' },
        { name: 'Bus condition', description: 'Bus is in poor mechanical or hygiene condition.' },
        { name: 'Other transport issue', description: 'Any other transport-related complaint.' },
      ],
    },
    {
      code: 'FINANCE',
      issues: [
        { name: 'Fee payment issue', description: 'Problem with fee payment processing.' },
        { name: 'Late fee waiver request', description: 'Request to waive or reduce a late fee penalty.' },
        { name: 'Fee blockage', description: 'Academic record is blocked due to outstanding fees.' },
        { name: 'Refund request', description: 'Requesting a refund for an overpaid or cancelled fee.' },
        { name: 'Exam fee issue', description: 'Issue related to examination fee payment.' },
        { name: 'Other finance issue', description: 'Any other finance-related complaint.' },
      ],
    },
    {
      code: 'EXAMS',
      issues: [
        { name: 'Class cancelled', description: 'Class was cancelled without prior notice.' },
        { name: 'Exam postponed', description: 'Examination has been postponed.' },
        { name: 'Result delay', description: 'Result has not been published as expected.' },
        { name: 'Admit card issue', description: 'Problem with admit card issuance.' },
        { name: 'Syllabus incomplete', description: 'Syllabus has not been fully covered.' },
        { name: 'Other exam issue', description: 'Any other examination-related complaint.' },
      ],
    },
    {
      code: 'ESTATE',
      issues: [
        { name: 'Roof leakage', description: 'Leakage from roof in classroom or facility.' },
        { name: 'Broken furniture', description: 'Chairs, desks, or other furniture are broken.' },
        { name: 'Classroom condition', description: 'Classroom is in poor condition.' },
        { name: 'Flooding', description: 'Flooding in building or campus area.' },
        { name: 'Power / Water / Gas issue', description: 'Utility service disruption on campus.' },
        { name: 'Canteen hygiene', description: 'Hygiene or quality concern at the canteen.' },
        { name: 'Other estate issue', description: 'Any other estate or maintenance complaint.' },
      ],
    },
    {
      code: 'IT',
      issues: [
        { name: 'No WiFi access', description: 'WiFi is unavailable or not accessible.' },
        { name: 'Slow internet', description: 'Internet connection is very slow.' },
        { name: 'Computer lab issue', description: 'Problem with computer lab equipment.' },
        { name: 'Software missing', description: 'Required software is not installed.' },
        { name: 'Network problem', description: 'General network connectivity issue.' },
        { name: 'Other IT issue', description: 'Any other IT-related complaint.' },
      ],
    },
    {
      code: 'HOSTEL',
      issues: [
        { name: 'Hostel room issue', description: 'Problem with assigned hostel room.' },
        { name: 'Maintenance required', description: 'Maintenance work needed in the hostel.' },
        { name: 'Hostel facility issue', description: 'Problem with hostel facilities (water, electricity, etc.).' },
        { name: 'Other hostel issue', description: 'Any other hostel-related complaint.' },
      ],
    },
    {
      code: 'LIBRARY',
      issues: [
        { name: 'Book not available', description: 'Required book is not available in the library.' },
        { name: 'Seating issue', description: 'Insufficient or uncomfortable seating.' },
        { name: 'Library computer issue', description: 'Library computer or terminal is not working.' },
        { name: 'AC / Lighting issue', description: 'Air conditioning or lighting problem in library.' },
        { name: 'Other library issue', description: 'Any other library-related complaint.' },
      ],
    },
    {
      code: 'SECURITY',
      issues: [
        { name: 'Theft reported', description: 'Theft of personal belongings reported.' },
        { name: 'Safety concern', description: 'General safety or security concern on campus.' },
        { name: 'Mobile / Bike stolen', description: 'Mobile phone or bicycle stolen from campus.' },
        { name: 'Other security issue', description: 'Any other security-related complaint.' },
      ],
    },
    {
      code: 'REGISTRAR',
      issues: [
        { name: 'Apply for Proforma', description: 'Application request for an academic proforma.' },
        { name: 'Apply for Transcript', description: 'Application request for an official transcript.' },
        { name: 'Proforma delay', description: 'Proforma application has been delayed.' },
        { name: 'Marks mismatch', description: 'Marks on transcript do not match academic record.' },
        { name: 'Transcript issue', description: 'Problem with transcript content or issuance.' },
        { name: 'Document correction', description: 'Request for correction of an official document.' },
        { name: 'Other registrar issue', description: 'Any other registrar-related complaint.' },
      ],
    },
    {
      code: 'SEMESTER',
      issues: [
        { name: 'Apply for Proforma', description: 'Application request for a semester proforma.' },
        { name: 'Proforma delay', description: 'Proforma application has been delayed.' },
        { name: 'Marks mismatch', description: 'Marks on record do not match expected result.' },
        { name: 'Status inquiry', description: 'Inquiry about application or document status.' },
        { name: 'Result issue', description: 'Problem with semester result publication.' },
        { name: 'Other semester cell issue', description: 'Any other semester cell-related complaint.' },
      ],
    },
    {
      code: 'ADVISOR',
      issues: [
        { name: 'General student complaint', description: 'General complaint requiring student advisor attention.' },
        { name: 'Other advisor issue', description: 'Any other student advisor-related complaint.' },
      ],
    },
    {
      code: 'ACADEMIC',
      issues: [
        { name: 'Computer lab not working', description: 'Academic computer lab is non-functional.' },
        { name: 'Software missing in lab', description: 'Required academic software is not installed in the lab.' },
        { name: 'Lab access issue', description: 'Unable to access academic lab facilities.' },
        { name: 'Projector not working', description: 'Classroom projector is not functioning.' },
        { name: 'Class cancelled', description: 'Academic class was cancelled without notice.' },
        { name: 'Teacher not coming', description: 'Assigned teacher has not been attending classes.' },
        { name: 'Assignment delay', description: 'Assignment results or feedback are unreasonably delayed.' },
        { name: 'Other academic issue', description: 'Any other academic department complaint.' },
      ],
    },
  ];

  for (const { code, issues } of issueData) {
    const deptId = deptMap[code];
    if (!deptId) continue;
    for (const issue of issues) {
      await prisma.issue.upsert({
        where: { departmentId_name: { departmentId: deptId, name: issue.name } },
        update: { description: issue.description },
        create: { departmentId: deptId, ...issue },
      });
    }
  }
  console.log('  ✓ Issues');

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminHash = await hashPassword('ChangeMe123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@portal.edu' },
    update: {},
    create: {
      email: 'admin@portal.edu',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('  ✓ Admin user (admin@portal.edu / ChangeMe123!)');

  // ── Staff users ───────────────────────────────────────────────────────────
  const staffHash = await hashPassword('Staff123!');
  const staffSeed = [
    { email: 'it.staff@portal.edu',        fullName: 'Ahmed Hassan',     deptCode: 'IT',        employeeId: 'EMP-IT-001' },
    { email: 'finance.staff@portal.edu',   fullName: 'Fatima Malik',     deptCode: 'FINANCE',   employeeId: 'EMP-FIN-001' },
    { email: 'registrar.staff@portal.edu', fullName: 'Dr. Zubair Ahmed', deptCode: 'REGISTRAR', employeeId: 'EMP-REG-001' },
    { email: 'semester.staff@portal.edu',  fullName: 'Sara Khan',        deptCode: 'SEMESTER',  employeeId: 'EMP-SEM-001' },
    { email: 'transport.staff@portal.edu', fullName: 'Omar Farooq',      deptCode: 'TRANSPORT', employeeId: 'EMP-TRN-001' },
  ];

  for (const s of staffSeed) {
    const deptId = deptMap[s.deptCode];
    if (!deptId) continue;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash: staffHash, role: 'STAFF', isActive: true },
    });
    await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: { fullName: s.fullName, departmentId: deptId, employeeId: s.employeeId },
      create: { userId: user.id, departmentId: deptId, fullName: s.fullName, employeeId: s.employeeId },
    });
  }
  console.log('  ✓ Staff users (password: Staff123!)');

  // ── Student users ──────────────────────────────────────────────────────────
  const studentHash = await hashPassword('Student123!');
  const students = [
    { seatNumber: 'CS-2026-001', fullName: 'Muhammad Ali Khan',    email: 'ali@student.edu',     program: 'BS Computer Science', department: 'Computer Science', semester: 6 },
    { seatNumber: 'CS-2026-002', fullName: 'Aisha Siddiqui',       email: 'aisha@student.edu',   program: 'BS Computer Science', department: 'Computer Science', semester: 4 },
    { seatNumber: 'BBA-2026-001',fullName: 'Bilal Raza',           email: 'bilal@student.edu',   program: 'BBA',                 department: 'Business',         semester: 5 },
    { seatNumber: 'MBA-2026-001',fullName: 'Zara Hussain',         email: 'zara@student.edu',    program: 'MBA',                 department: 'Management',       semester: 2 },
    { seatNumber: 'ENG-2026-001',fullName: 'Hamza Tariq',          email: 'hamza@student.edu',   program: 'BE Electronics',      department: 'Electronics',      semester: 7 },
  ];

  for (const s of students) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash: studentHash, role: 'STUDENT', isActive: true },
    });
    await prisma.student.upsert({
      where: { seatNumber: s.seatNumber },
      update: { fullName: s.fullName, email: s.email },
      create: { userId: user.id, ...s },
    });
  }
  console.log('  ✓ Student users (password: Student123!)');

  console.log('\n✅  Seed complete.\n');
  console.log('  Demo credentials:');
  console.log('    Admin   : admin@portal.edu / ChangeMe123!');
  console.log('    Staff IT: it.staff@portal.edu / Staff123!');
  console.log('    Student : CS-2026-001 / Student123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
