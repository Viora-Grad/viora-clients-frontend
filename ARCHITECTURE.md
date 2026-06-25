# Angular v20+ Frontend Architecture

## Overview

This document defines the standard frontend architecture for our Angular v20+ applications.

### Goals

- Scalable
- Maintainable
- Feature-isolated
- Lazy-load friendly
- SaaS-ready
- Clean separation of concerns
- Aligned with Clean Architecture principles

This architecture uses:

- Standalone components
- Feature-based structure
- Core / Shared separation
- Proper DTO and API layering
- Permission-ready structure

---

# High-Level Folder Structure

```
src/
│
├── app/
│ ├── core/
│ ├── shared/
│ ├── features/
│ ├── app.routes.ts
│ ├── app.config.ts
│ └── app.component.ts
│
├── environments/
├── assets/
└── main.ts
```

---

# 1. Core (Infrastructure Layer)

📁 `app/core`

The Core folder contains global infrastructure and cross-cutting concerns.

These services are application-wide singletons.

## Responsibilities

- Authentication
- Authorization / Permissions
- HTTP configuration
- Interceptors
- Global guards
- App configuration
- Layout components (Shell, Navbar, Sidebar)

## Example Structure

```
core/
├── auth/
│ ├── auth.service.ts
│ ├── auth.api.ts
│ ├── permission.service.ts
│ └── auth.guard.ts
│
├── http/
│ ├── api-client.service.ts
│ ├── auth.interceptor.ts
│ └── error.interceptor.ts
│
├── config/
│ └── app-config.service.ts
│
└── layout/
├── shell.component.ts
├── navbar.component.ts
└── sidebar.component.ts
```

## Rules

- Core contains only global infrastructure.
- Core must NOT contain feature-specific business logic.
- Core must NOT import feature modules.
- If all features were deleted, Core would still make sense.

---

# 2. Shared (Reusable UI Layer)

📁 `app/shared`

The Shared folder contains reusable UI components and helpers.

## Responsibilities

- Reusable UI components
- Generic directives
- Pure pipes
- Utility functions

## Example Structure

```
shared/
├── components/
│ ├── ui-button/
│ ├── ui-table/
│ └── ui-dialog/
│
├── directives/
│ └── has-permission.directive.ts
│
├── pipes/
│ └── safe-html.pipe.ts
│
└── utils/
└── date.util.ts
```

## Rules

Shared must NOT:

- Contain business logic
- Call backend APIs
- Depend on a specific feature

Shared must remain pure and reusable.

---

# 3. Features (Business Domains)

📁 `app/features`

Each feature is isolated and self-contained.

Each feature contains:

- Its own API layer
- Its own DTOs
- Its own models
- Its own business services
- Its own pages and components
- Its own routes

---

## Feature Structure Example (Users)

```
features/
└── users/
├── data/
│ ├── users.api.ts
│ ├── users.dto.ts
│ └── users.mapper.ts
│
├── models/
│ └── user.model.ts
│
├── services/
│ └── users.service.ts
│
├── pages/
│ ├── users-list.page.ts
│ └── user-details.page.ts
│
├── components/
│ └── user-form.component.ts
│
└── users.routes.ts
```

---

# Feature Layer Responsibilities

## data/

Infrastructure for that specific feature.

Contains:

- Raw HTTP calls
- DTO definitions
- Mapping logic (DTO ↔ Model)

### Example

- `users.api.ts` → HttpClient calls
- `users.dto.ts` → Backend contracts
- `users.mapper.ts` → Transformation logic

---

## models/

Frontend domain models.

These represent UI-friendly structures.

DTOs must NOT be used directly in components.

---

## services/

Feature business logic.

Responsibilities:

- Call API layer
- Map DTOs to models
- Apply business rules
- Expose clean data to UI

Components should NEVER call HttpClient directly.

---

## pages/

Smart components (route-level).

Responsibilities:

- Fetch data
- Interact with services
- Handle routing
- Manage state

---

## components/

Dumb / Presentational components.

Responsibilities:

- Input / Output only
- No API calls
- No business logic

---

# Routing Strategy

All features must be lazy-loaded.

### app.routes.ts

```ts
{
  path: 'users',
  loadChildren: () =>
    import('./features/users/users.routes')
      .then(m => m.USERS_ROUTES)
}
```

Each feature manages its own routes inside `feature.routes.ts`.

---

# Permission Architecture

Permissions are centralized in the Core layer to ensure consistency and maintainability.

## Location

```
core/auth/permission.service.ts
shared/directives/has-permission.directive.ts
```

## Design Principles

- Do NOT check roles directly inside components.
- Always rely on a centralized `PermissionService`.
- Use a structural directive (`*appHasPermission`) for UI rendering.
- Backend must always enforce permissions again.
- Frontend permission checks are for UI/UX only.

---

## Example: Permission Service

```ts
@Injectable({ providedIn: 'root' })
export class PermissionService {
	private permissions = signal<string[]>([]);

	setPermissions(perms: string[]) {
		this.permissions.set(perms);
	}

	has(permission: string): boolean {
		return this.permissions().includes(permission);
	}

	hasAny(perms: string[]): boolean {
		return perms.some((p) => this.permissions().includes(p));
	}

	hasAll(perms: string[]): boolean {
		return perms.every((p) => this.permissions().includes(p));
	}
}
```

---

# API Flow

All data access must follow a strict layered flow.

## Correct Data Flow

Component
→ Feature Service
→ API Layer
→ Backend

---

## Responsibilities per Layer

### Component

- Calls feature service
- Displays data
- Does **NOT** call `HttpClient` directly
- Does **NOT** use DTOs

---

### Feature Service

- Calls API layer
- Maps DTOs to frontend models
- Applies business rules
- Exposes clean, UI-ready data

---

### API Layer (`data/` folder)

- Contains raw `HttpClient` calls
- Defines DTOs
- No business logic
- No UI logic

---

## Important Rules

- DTOs must **NEVER** reach the component.
- Mapping must occur in the service layer.
- Components must never import `HttpClient`.
- Business rules must not exist in the API layer.

---

# Architectural Rules Summary

## Core

- Global infrastructure only
- Authentication & Authorization
- HTTP interceptors
- Global guards
- Singleton services
- No feature-specific business logic
- Must not import features

---

## Shared

- Reusable UI components only
- Generic directives & pipes
- Utility helpers
- No backend calls
- No business rules
- Must remain feature-agnostic

---

## Features

- Fully isolated business domains
- Own API layer (`data/`)
- Own DTOs
- Own frontend models
- Own services
- Own pages & components
- Own routes
- Must be lazy-loaded
- Must not import other features directly
