# FamilySplit 💰

App familiar de control de gastos compartidos. Divide gastos con tu familia o amigos de forma fácil y transparente.

## Stack tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel

## Características

- ✅ Autenticación con email/password
- ✅ Crear grupos familiares o de amigos
- ✅ Agregar gastos con división equitativa o por montos exactos
- ✅ Ver balances en tiempo real (quién debe a quién)
- ✅ Registrar pagos para saldar deudas
- ✅ Categorías predefinidas en español
- ✅ Moneda MXN por defecto
- ✅ Diseño mobile-first

## Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/marcocruz/family-split.git
cd family-split
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`
3. En **Authentication > Providers**, asegúrate de que Email esté habilitado

### 4. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key de tu proyecto

Encuentra estos valores en: **Supabase Dashboard → Project Settings → API**

### 5. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Deploy a Vercel

1. Haz push del repositorio a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 🚀

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   └── (app)/            # Páginas protegidas
│       ├── dashboard/    # Balance general
│       └── groups/       # Grupos y gastos
├── components/
│   ├── ui/               # Componentes base
│   ├── expenses/         # Componentes de gastos
│   ├── groups/           # Componentes de grupos
│   └── layout/           # Navbar y layout
├── hooks/                # Custom hooks
└── lib/
    ├── supabase/         # Clientes y tipos de Supabase
    └── utils/            # Utilidades (balance, moneda)
supabase/
└── schema.sql            # Schema completo de base de datos
```

## Base de datos

El schema incluye las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario (extiende auth.users) |
| `groups` | Grupos de gastos compartidos |
| `group_members` | Miembros de cada grupo |
| `categories` | Categorías de gastos (10 por defecto) |
| `expenses` | Gastos registrados |
| `expense_splits` | División de cada gasto entre miembros |
| `payments` | Pagos para saldar deudas |

## Licencia

MIT
