# Menged - Transport Information System for Addis Ababa

Menged is a comprehensive transport information system for Addis Ababa, providing route planning, road closure information, and transport analytics.

## Features

- **Route Planning**: Plan your journey through Addis Ababa using public transport and walking
- **Road Closures**: Stay updated on road closures due to events or maintenance
- **Public Holidays**: View public holidays and their impact on transport schedules
- **Analytics Dashboard**: For transport officials to monitor transport metrics

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, TailwindCSS, shadcn/ui
- **Authentication**: NextAuth.js with Prisma adapter
- **Database**: PostgreSQL with PostGIS extension
- **Routing Engine**: OpenTripPlanner (OTP)
- **Containerization**: Docker and Docker Compose

## Project Structure

```
menged/
├── menged-ui/            # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utility functions and hooks
│   ├── prisma/           # Prisma schema and migrations
│   └── public/           # Static assets
└── docker-compose.yml    # Docker Compose for OTP and PostGIS
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/menged.git
   cd menged
   ```

2. Start the backend services (PostGIS and OpenTripPlanner):
   ```bash
   docker-compose up -d
   ```

3. Start the Next.js application:
   ```bash
   cd menged-ui
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

To deploy the entire stack with Docker:

```bash
# Start backend services
docker-compose up -d

# Build and start the UI
cd menged-ui
docker-compose up -d
```

## Environment Variables

Create a `.env` file in the `menged-ui` directory with the following variables:

```
# Database
DATABASE_URL=postgresql://admin:adminpassword@localhost:5432/gtfs_dev_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production

# OpenTripPlanner
OTP_API_URL=http://localhost:8080/otp/routers/default/index/graphql

# Optional: Mapbox (for better maps)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenTripPlanner](https://www.opentripplanner.org/) for the routing engine
- [Next.js](https://nextjs.org/) for the frontend framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Mapbox](https://www.mapbox.com/) for the mapping capabilities

