# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Operations
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:generate` - Generate Prisma migrations for production
- `npm run db:migrate` - Deploy migrations to production
- `npm run db:studio` - Open Prisma Studio database GUI

### Development & Build
- `npm run dev` - Start development server with Turbo (port 3000)
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run Biome linter
- `npm run check:write` - Fix linting issues automatically

### Testing & Validation
- Always run `npm run typecheck` and `npm run check` before committing
- Use `npm run build` to verify production readiness

## Architecture Overview

This is a **T3 Stack** application (Next.js + tRPC + Prisma + TypeScript) using the App Router pattern.

### Key Stack Components
- **Next.js 15** with App Router and React 19
- **tRPC v11** for end-to-end type-safe APIs
- **Prisma** ORM with PostgreSQL
- **Tailwind CSS v4** for styling
- **Biome** for linting and formatting
- **React Query** for server state management

### Directory Structure
```
src/
├── app/                    # App Router pages and layouts
│   ├── _components/        # Shared React components
│   ├── api/trpc/          # tRPC API endpoint
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Homepage
├── server/                # Server-side code
│   ├── api/               # tRPC routers and configuration
│   │   ├── routers/       # Feature-based API routers
│   │   ├── root.ts        # Main router composition
│   │   └── trpc.ts        # tRPC setup and context
│   └── db.ts              # Prisma client instance
├── trpc/                  # tRPC client configuration
│   ├── react.tsx          # Client-side tRPC with React Query
│   └── server.ts          # Server-side tRPC for RSC
└── env.js                 # Type-safe environment variables
```

### tRPC Architecture Pattern
- **Router Organization**: Feature-based routers in `src/server/api/routers/`
- **Type Safety**: Full end-to-end type inference from server to client
- **Client Integration**: Dual setup for both RSC (`~/trpc/server`) and client components (`~/trpc/react`)
- **Validation**: Zod schemas for input/output validation

### Database Architecture
- **Prisma Schema**: Located in `prisma/schema.prisma`
- **Client Generation**: Automatic via `postinstall` script
- **Development Workflow**: Use `db:push` for schema changes, `db:generate` for migrations

### Environment Configuration
- **Type-Safe Variables**: Validated via `src/env.js` with Zod
- **Database**: Configured via `DATABASE_URL` environment variable
- **Validation**: Automatic validation prevents builds with invalid env vars

## Code Conventions

### Import Patterns
- Use path alias `~/*` for `./src/*` imports
- Server-side imports: `import { api } from "~/trpc/server"`
- Client-side imports: `import { api } from "~/trpc/react"`

### Component Organization
- Shared components in `src/app/_components/`
- Co-locate feature-specific components with their usage
- Use TypeScript interfaces for component props

### API Development
- Create feature-based routers in `src/server/api/routers/`
- Export routers from `src/server/api/root.ts`
- Use Zod for input validation: `z.object({ name: z.string() })`
- Leverage tRPC procedures: `publicProcedure.input().query()` or `.mutation()`

### Database Development
- Define models in `prisma/schema.prisma`
- Use `npm run db:push` for development schema changes
- Access database via `import { db } from "~/server/db"`
- Leverage Prisma's type-safe query builder

## Development Workflow

### Adding New Features
1. Define database schema in `prisma/schema.prisma`
2. Run `npm run db:push` to sync schema
3. Create tRPC router in `src/server/api/routers/`
4. Export router from `src/server/api/root.ts`
5. Use `api.routerName.procedureName` in components
6. Run `npm run typecheck` and `npm run check` before committing

### Styling Approach
- Tailwind CSS v4 with utility classes
- Custom CSS in `src/styles/globals.css`
- Geist font family pre-configured
- Biome automatically sorts Tailwind classes

### Error Handling
- tRPC provides automatic error boundaries
- Zod validation errors are formatted for client consumption
- Use React Query's error states for UI feedback