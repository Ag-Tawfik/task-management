## Task Management System (Laravel + Filament + Next.js)

### Stack
- **Backend**: Laravel 12 + Filament v5 (admin panel)
- **Database**: MySQL (Docker)
- **Frontend**: Next.js 16 (App Router)
- **API**: Used **only** by the Next.js frontend (regular users). Admins use Filament directly.

### Services / URLs
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`
- **Admin panel (Filament)**: `http://localhost:8000/admin`
- **API base**: `http://localhost:8000/api`

### Run (Docker)
#### Step-by-step

1) **Start Docker**
- Make sure **Docker Desktop** is running.

2) **Build + start containers**
From the repo root:

```powershell
docker compose up -d --build
```

3) **Run migrations**
Open a second terminal (same folder) and run:

docker compose exec backend php artisan migrate

4) **Seed demo data (users + tasks)**

```powershell
docker compose exec backend php artisan db:seed
```
#### Reset database (optional)
If you want a clean DB:

```powershell
docker compose exec backend php artisan migrate:fresh --seed
```

5) **Open the app**
- User panel: `http://localhost:3000`
- Admin panel: `http://localhost:8000/admin`

### Accounts (seeded)
- **Admin (Filament only)**: `admin@example.com` / `password`
- **Regular user (Next.js + API)**: `user@example.com` / `password`