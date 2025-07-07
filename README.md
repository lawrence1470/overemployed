# Are We Hiring the Same Guy?

A privacy-first employment verification platform that helps companies detect potential employment conflicts by securely cross-referencing employee data across multiple organizations and HR systems.

## 🚀 Features

- **🔍 Smart Employee Matching**: Advanced algorithms detect potential dual employment with high accuracy
- **🔐 Privacy-First Design**: All employee data encrypted and processed with GDPR/CCPA compliance
- **🏢 HR System Integrations**: Seamless sync with JustWorks, BambooHR, Workday, ADP, and more
- **📊 Real-Time Dashboard**: Interactive analytics and risk assessment visualizations
- **⚡ Instant Alerts**: Webhook notifications and real-time conflict detection
- **📈 Comprehensive Reporting**: Executive summaries, compliance reports, and detailed analytics

## 🏗️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Database**: [PostgreSQL](https://postgresql.org) with [Prisma ORM](https://prisma.io)
- **API**: [tRPC](https://trpc.io) for end-to-end type safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Deployment**: [Vercel](https://vercel.com) with edge functions
- **Language**: [TypeScript](https://typescriptlang.org) for type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/overemployed-detection.git
   cd overemployed-detection
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/overemployed"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Encryption
   ENCRYPTION_KEY="your-32-character-encryption-key"
   GLOBAL_SALT="your-global-salt"
   
   # HR Integrations (optional)
   JUSTWORKS_CLIENT_ID="your_justworks_client_id"
   JUSTWORKS_CLIENT_SECRET="your_justworks_client_secret"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Documentation

### Core Documentation
- [📋 System Architecture](docs/architecture.md) - Technical overview and design patterns
- [🚀 Deployment Guide](docs/deployment.md) - Production deployment and DevOps
- [🔒 Privacy Policy](docs/privacy-policy.md) - Privacy compliance template

### Feature Specifications
- [🎯 Employee Matching Engine](docs/specs/features/employee-matching.md) - Matching algorithms and confidence scoring
- [🔗 HR System Integrations](docs/specs/features/hr-integrations.md) - Integration patterns and data sync
- [🛡️ Privacy & Compliance](docs/specs/features/privacy-compliance.md) - GDPR, CCPA, and security controls
- [📊 Reporting Dashboard](docs/specs/features/reporting-dashboard.md) - Analytics and visualization

### API Documentation
- [🔌 OpenAPI Specification](docs/specs/api/openapi.yml) - Complete API reference
- [🪝 Webhooks Guide](docs/specs/api/webhooks.md) - Real-time event notifications

### HR Integration Guides
- [📋 JustWorks Integration](docs/specs/integrations/justworks.md) - OAuth setup and data mapping
- [🎋 BambooHR Integration](docs/specs/integrations/bamboohr.md) - API key auth and custom fields
- [💼 Workday Integration](docs/specs/integrations/workday.md) - SOAP API and complex data structures
- [📊 ADP Integration](docs/specs/integrations/adp.md) - OAuth 2.0 and nested data handling

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run Biome linter
- `npm run check:write` - Fix linting issues automatically
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio

### Database Operations

- `npm run db:generate` - Generate Prisma migrations
- `npm run db:migrate` - Deploy migrations to production
- `npm run db:push` - Push schema changes (development)
- `npm run db:studio` - Open database GUI

### Code Quality

- `npm run check` - Lint code with Biome
- `npm run check:write` - Auto-fix linting issues
- `npm run typecheck` - Type checking with TypeScript

## 🔒 Security & Privacy

This platform is designed with privacy and security as core principles:

- **🔐 Encryption**: All PII encrypted at rest (AES-256) and in transit (TLS 1.3)
- **🔑 Hashed Identifiers**: Employee matching uses hashed identifiers, not raw data
- **🛡️ Access Controls**: Role-based permissions and company data isolation
- **📋 Compliance**: Built-in GDPR, CCPA, and SOC 2 compliance controls
- **🔍 Audit Logging**: Complete audit trails for all data access and processing

## 🏢 HR System Integrations

### Supported Platforms

| Platform | Auth Method | Real-time Sync | Custom Fields | Status |
|----------|-------------|----------------|---------------|---------|
| JustWorks | OAuth 2.0 | ✅ Webhooks | ✅ | Production Ready |
| BambooHR | API Key | 🔄 Polling | ✅ | Production Ready |
| Workday | OAuth 2.0 | ✅ Events | ✅ | Production Ready |
| ADP | OAuth 2.0 | ✅ Events | ✅ | Production Ready |
| Custom HRIS | Various | ✅ | ✅ | Contact Us |

### Integration Features

- **🔄 Automated Sync**: Real-time or scheduled data synchronization
- **📊 Custom Field Mapping**: Map any HR field to our standardized schema
- **🔔 Event Notifications**: Instant webhooks for employee changes
- **🛡️ Secure Authentication**: Industry-standard OAuth 2.0 and API key auth
- **📈 Sync Monitoring**: Real-time status and error reporting

## 📊 Analytics & Reporting

### Dashboard Features

- **📈 Match Overview**: Real-time conflict detection statistics
- **🌐 Network Visualization**: Interactive employee relationship mapping
- **🔥 Risk Heatmaps**: Geographic and temporal risk analysis
- **📋 Integration Status**: HR system health and sync monitoring
- **🤖 Predictive Analytics**: ML-powered trend prediction

### Report Types

- **👔 Executive Summary**: High-level metrics and key findings
- **🔍 Detailed Analysis**: Comprehensive match details and evidence
- **📋 Compliance Report**: Audit trails and regulatory compliance
- **⚠️ Risk Assessment**: Threat analysis and recommendations
- **📊 Integration Status**: System health and performance metrics

## 🚀 Deployment

### Production Deployment

The application is optimized for deployment on Vercel with the following stack:

- **🌐 Frontend**: Vercel Edge Network with global CDN
- **⚡ Backend**: Serverless functions with automatic scaling  
- **🗄️ Database**: Neon PostgreSQL with read replicas
- **🔄 Cache**: Redis for session and application caching
- **📊 Monitoring**: DataDog for metrics and Sentry for error tracking

### Deployment Options

1. **Vercel (Recommended)**
   ```bash
   vercel --prod
   ```

2. **Docker**
   ```bash
   docker build -t overemployed-detection .
   docker run -p 3000:3000 overemployed-detection
   ```

3. **Self-Hosted**
   ```bash
   npm run build
   npm run start
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run check && npm run typecheck`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- 📚 [Full Documentation](docs/) - Comprehensive guides and API reference
- 🎯 [Architecture Overview](docs/architecture.md) - Technical system design
- 🔗 [Integration Guides](docs/specs/integrations/) - HR system setup instructions

### Community & Support
- 💬 [GitHub Discussions](https://github.com/your-org/overemployed-detection/discussions) - Community Q&A
- 🐛 [Issue Tracker](https://github.com/your-org/overemployed-detection/issues) - Bug reports and feature requests
- 📧 [Email Support](mailto:support@overemployed-detection.com) - Direct technical support

## 🙏 Acknowledgments

Built with the [T3 Stack](https://create.t3.gg/) - Next.js, TypeScript, tRPC, and Prisma.

Special thanks to:
- [Vercel](https://vercel.com) for deployment platform
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Prisma](https://prisma.io) for database tooling
- [tRPC](https://trpc.io) for type-safe APIs

---

<div align="center">
  <strong>Protecting businesses from employment conflicts while respecting privacy</strong>
  <br />
  <sub>Made with ❤️ for HR teams everywhere</sub>
</div>