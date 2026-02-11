# Multi-Tenant SaaS ERP System

A comprehensive Enterprise Resource Planning (ERP) system built with Next.js, Supabase, and TypeScript. Designed for textile businesses with multi-tenant architecture, role-based access control, and enterprise-grade features.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete tenant isolation with Row Level Security (RLS)
- **Role-Based Access Control**: Super Admin, Admin, Staff, and Viewer roles
- **Finance Module**: Invoice management, FBR e-invoicing integration (Pakistan tax compliance)
- **Textile Module**: TNA (Time and Action) workflow, production tracking
- **Production Module**: Weaving execution and monitoring
- **Quality Control**: Inspection workflows and defect tracking
- **Inventory Management**: Stock tracking with transaction history
- **User Management**: Team invitations, role assignments, permissions

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Email**: Resend
- **Testing**: Vitest, Testing Library
- **Type Safety**: TypeScript

## 📋 Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account
- (Optional) Resend account for email features

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ERP-PROJECT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the values in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MOCK_SUPER_ADMIN=true
   ```

4. **Run database migrations**
   
   In your Supabase project, run the SQL migrations in order:
   - `supabase/migrations/20260202044052_remote_schema.sql`
   - `supabase/migrations/20260202_enterprise_foundation.sql`
   - `supabase/migrations/20260203_saas_foundation.sql`
   - `supabase/migrations/20260203_textile_module.sql`
   - `supabase/migrations/20260203_finance_module.sql`
   - `supabase/migrations/20260203_fbr_integration.sql`
   - `supabase/migrations/20260203_whatsapp_integration.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables for Production

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:
- `RESEND_API_KEY` (for email features)
- `EMAIL_FROM` (verified sender email)
- `SENTRY_DSN` (for error tracking)

## 📚 Documentation

- [API Documentation](./docs/API.md) *(coming soon)*
- [Database Schema](./docs/DATABASE.md) *(coming soon)*
- [Deployment Guide](./docs/DEPLOYMENT.md) *(coming soon)*
- [User Guide](./docs/USER_GUIDE.md) *(coming soon)*

## 🏗️ Project Structure

```
ERP-PROJECT/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── dashboard/    # Dashboard modules
│   │   ├── admin/        # Admin panel
│   │   ├── onboarding/   # Tenant onboarding
│   │   └── ...
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   ├── services/         # Business logic
│   └── __tests__/        # Test files
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── ...
```

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- Multi-tenant data isolation
- Security headers (CSP, HSTS, etc.)
- Input validation and sanitization
- CSRF protection
- Rate limiting

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Note**: This project is currently in active development. Some features may be incomplete or subject to change.
