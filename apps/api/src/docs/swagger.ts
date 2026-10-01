import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'University of Karachi Student Portal API',
    version: '1.0.0',
    description: [
      '## University of Karachi Student Issue Management & Document Application System',
      '',
      'This API powers the complete student portal:',
      '- **Student**: Submit complaints, apply for documents, track status',
      '- **Staff**: Process department tickets and applications',
      '- **Admin**: System-wide management, reports, and configuration',
      '',
      '### Authentication',
      'Students log in with **Seat Number + Password**.',
      'Staff and Admin log in with **Email + Password**.',
      'All protected endpoints require a Bearer JWT token.',
      '',
      '### Demo Credentials',
      '- Admin: `admin@portal.edu` / `ChangeMe123!`',
      '- Staff (IT): `it.staff@portal.edu` / `Staff123!`',
      '- Student: Seat `CS-2026-001` / `Student123!`',
    ].join('\n'),
    contact: { name: 'Portal Support', email: 'support@portal.edu' },
  },
  servers: [
    { url: '/api', description: 'API server' },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Obtain via /api/auth/student/login or /api/auth/staff/login',
      },
    },
    schemas: {
      StudentLoginRequest: {
        type: 'object',
        required: ['seatNumber', 'password'],
        properties: {
          seatNumber: { type: 'string', example: 'CS-2026-001' },
          password: { type: 'string', format: 'password', example: 'Student123!' },
        },
      },
      StaffLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'it.staff@portal.edu' },
          password: { type: 'string', format: 'password', example: 'Staff123!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: { $ref: '#/components/schemas/UserProfile' },
            },
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['STUDENT', 'STAFF', 'ADMIN'], example: 'STUDENT' },
          student: { $ref: '#/components/schemas/StudentProfile' },
          staffProfile: { $ref: '#/components/schemas/StaffProfile' },
        },
      },
      StudentProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          seatNumber: { type: 'string', example: 'CS-2026-001' },
          fullName: { type: 'string', example: 'Muhammad Ali Khan' },
          email: { type: 'string', example: 'ali@student.edu' },
          program: { type: 'string', example: 'BS Computer Science' },
          department: { type: 'string', example: 'Computer Science' },
          semester: { type: 'integer', example: 6 },
        },
      },
      StaffProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Ahmed Hassan' },
          employeeId: { type: 'string', example: 'EMP-IT-001' },
          department: { $ref: '#/components/schemas/Department' },
        },
      },
      Department: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'IT Department / Computer Centre' },
          code: { type: 'string', example: 'IT' },
          description: { type: 'string' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Issue: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          departmentId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Slow internet' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ticketNumber: { type: 'string', example: 'TKT-2026-000123' },
          department: { $ref: '#/components/schemas/Department' },
          issue: { $ref: '#/components/schemas/Issue' },
          description: { type: 'string', example: 'WiFi has been down in Block B for 3 days.' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED'], example: 'OPEN' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          applicationNumber: { type: 'string', example: 'APP-2026-000001' },
          applicationType: { type: 'string', enum: ['PROFORMA', 'TRANSCRIPT'] },
          office: { type: 'string', enum: ['REGISTRAR_OFFICE', 'SEMESTER_CELL'] },
          numberOfSemesters: { type: 'integer', example: 6 },
          purpose: { type: 'string', example: 'Required for job application' },
          baseFee: { type: 'string', example: '1000.00' },
          perSemesterFee: { type: 'string', example: '200.00' },
          totalFee: { type: 'string', example: '2200.00' },
          status: {
            type: 'string',
            enum: ['APPLICATION_SUBMITTED', 'WAITING_FOR_PAYMENT', 'PAYMENT_RECEIVED', 'UNDER_PROCESS', 'READY_FOR_COLLECTION', 'COMPLETED', 'REJECTED'],
            example: 'WAITING_FOR_PAYMENT',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateDepartmentRequest: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', example: 'IT Department / Computer Centre' },
          code: { type: 'string', example: 'IT' },
          description: { type: 'string' },
        },
      },
      UpdateDepartmentRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      CreateIssueRequest: {
        type: 'object',
        required: ['departmentId', 'name'],
        properties: {
          departmentId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Slow internet' },
          description: { type: 'string' },
        },
      },
      UpdateIssueRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      CreateApplicationRequest: {
        type: 'object',
        required: ['office', 'applicationType', 'numberOfSemesters', 'purpose'],
        properties: {
          office: { type: 'string', enum: ['REGISTRAR_OFFICE', 'SEMESTER_CELL'] },
          applicationType: { type: 'string', enum: ['PROFORMA', 'TRANSCRIPT'] },
          numberOfSemesters: { type: 'integer', minimum: 1, maximum: 20, example: 6 },
          purpose: { type: 'string', example: 'Required for visa application' },
          notes: { type: 'string' },
        },
      },
      CreateStaffRequest: {
        type: 'object',
        required: ['email', 'password', 'fullName', 'departmentId', 'employeeId'],
        properties: {
          email: { type: 'string', format: 'email', example: 'staff@portal.edu' },
          password: { type: 'string', format: 'password', minLength: 8 },
          fullName: { type: 'string', example: 'Dr. Staff Member' },
          departmentId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', example: 'EMP-001' },
          phone: { type: 'string' },
        },
      },
      UpdateStaffRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          departmentId: { type: 'string', format: 'uuid' },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'TICKET_NOT_FOUND' },
              message: { type: 'string', example: 'Ticket not found.' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required or token invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' } },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { success: false, error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found.' } },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', details: {} } },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Verify the API is running.',
        security: [],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                example: { success: true, data: { status: 'ok' } },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  const options: swaggerUi.SwaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'UoK Student Portal API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
    },
  };

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(spec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, options));
}
