# Lynkika Logistics Platform

Enterprise-grade logistics and transportation management system for Kenya, featuring real-time tracking, role-based access control, and comprehensive analytics.

## 🚀 Features

### Customer Services
- **Moving Services**: Household and office relocations with professional handling
- **Freight & Full Load**: Large cargo transportation with capacity optimization
- **Scheduled Routes**: Regular inter-city services with predictable schedules
- **Courier Services**: Express document and package delivery with tracking

### Enterprise Admin Dashboard
- Real-time booking management with status progression controls
- Route planning and capacity optimization
- Quote processing with automated pricing
- Advanced tracking with location updates
- Revenue analytics and business intelligence
- Role-based access control and security monitoring

### Service Coverage
- **Primary Routes**: Nairobi ↔ Mombasa, Nairobi ↔ Kisumu, Nairobi ↔ Eldoret
- **Regional Routes**: Nakuru, Nyeri, Meru, Thika, Malindi
- **Express Services**: Same-day and next-day delivery options
- **Specialized Transport**: Temperature-controlled and fragile item handling

## 🛠️ Technology Stack

- **Frontend**: React 18, Material-UI 5, Recharts, Framer Motion
- **Backend**: Node.js, Express.js with enterprise security middleware
- **Database**: PostgreSQL with Supabase (production-ready with RLS)
- **Authentication**: JWT with role-based permissions and session management
- **Security**: Rate limiting, input validation, audit logging, RBAC
- **Charts**: Interactive revenue analytics with trend visualization

## 🔐 Security Features

- **Role-Based Access Control**: Super Admin, Operations Manager, Dispatcher roles
- **Status Progression Security**: Forward-only booking status changes
- **Audit Logging**: Comprehensive security event tracking
- **Session Management**: Enhanced JWT with automatic cleanup
- **Rate Limiting**: API protection with configurable limits
- **Input Validation**: XSS prevention and data sanitization

## 📊 Business Intelligence

- **Revenue Analytics**: Real-time income tracking with trend analysis
- **Service Performance**: Revenue breakdown by service type
- **Monthly Trends**: 12-month revenue visualization
- **Operational Metrics**: Booking volumes, route utilization
- **Security Dashboard**: System monitoring and threat detection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account with PostgreSQL database
- Production environment variables

### Production Deployment

1. **Database Setup**
```sql
-- Run in Supabase SQL Editor
-- 1. Execute database/schema.sql
-- 2. Execute database/seed.sql
```

2. **Environment Configuration**
```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
PORT=5000
```

3. **Application Deployment**
```bash
# Install dependencies
npm install
cd client && npm install && npm run build

# Start production server
npm start
```

## 👥 User Roles & Permissions

### Super Administrator
- ✅ Full system access and user management
- ✅ Revenue analytics and financial reports
- ✅ Security monitoring and audit logs
- ✅ System configuration and settings
- ✅ All operational permissions

### Operations Manager
- ✅ Route management and optimization
- ✅ Revenue analytics and reporting
- ✅ Quote processing and approval
- ✅ Booking oversight and management
- ❌ User management and security settings

### Dispatcher
- ✅ Daily booking operations
- ✅ Status updates and tracking
- ✅ Courier shipment creation
- ❌ Route management and pricing
- ❌ Financial data and analytics

## 🔄 Booking Status Workflow

```
Pending → Confirmed → Picked (Store) → In Transit → Delivered
                  ↘ In Transit → Delivered (Direct)
```

**Security Rules:**
- Forward-only progression (no backward status changes)
- "Picked" status restricted to Super Admin/Operations Manager
- Automatic audit logging for all status changes
- Role-based validation on every update

## 📈 Revenue Analytics

- **Real-time Calculations**: Based on delivered bookings only
- **Multi-timeframe Analysis**: Daily, weekly, monthly, and total revenue
- **Service Breakdown**: Revenue distribution by service type
- **Trend Visualization**: Interactive charts with 12-month history
- **Role-based Access**: Financial data restricted to management roles

## 🏗️ Production Architecture

```
Client (React) → Load Balancer → Node.js API → Supabase PostgreSQL
                                      ↓
                              Security Middleware
                              Rate Limiting
                              Audit Logging
```

## 📞 Production Support

- **System Monitoring**: Real-time health checks and alerts
- **Security Incidents**: Automated threat detection and response
- **Performance Optimization**: Database query optimization and caching
- **Backup & Recovery**: Automated daily backups with point-in-time recovery

## 📄 License

Copyright © 2024 Lynkika Logistics. All rights reserved.

---

**Production Ready** | **Enterprise Grade** | **Secure by Design**