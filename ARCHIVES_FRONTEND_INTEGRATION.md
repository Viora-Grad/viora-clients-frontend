# Archives Module — Frontend Integration Plan

> Handoff spec for the Angular frontend. Covers every endpoint of the Archives API
> (`Viora.Api/Controllers/Archives/ArchivesController.cs`), what it returns, when to call it,
> and how to wire it up. Follow the phases in order — that's the dependency order.

---

## 1. Mental model

An **Archive** is a container owned by an organization. It holds:

- a **folder tree** (folders can nest; the archive auto-creates a root folder), and
- **templates** — each template defines its fields in **versions**. You create a version,
  fill in its field definitions, then **publish** it.
- **Records** are filled-in instances: each record lives in a folder and references a
  **published template version**, carrying the actual field values (and optional attachments).

Dependency order (and the order to build the UI):

```
Organization
  └─ Archive            (Phase 1)
       ├─ Folders       (Phase 2)  ── tree
       └─ Templates     (Phase 3)  ── + versions, publish
            └─ Records  (Phase 4)  ── instances bound to a published version
```

---

## 2. Setup

- **Base path:** all routes are under `api/archives`.
- **Auth:** every request needs a bearer token: `Authorization: Bearer <accessToken>`.
  Put this in a single `HttpInterceptor` so you never repeat it.
- **Wire format:** default System.Text.Json — **camelCase** property names, and
  **enums are numbers** (see `FieldType` below). No `{ data: ... }` envelope; the body *is* the object.
- **Response conventions:**
  - Create endpoints return the **full DTO** (not a bare id).
  - Update / delete / publish return an **empty body** (HTTP 200/204).
  - Errors come back as ASP.NET `ProblemDetails`: `{ title, status, detail }` — read `title`
    as the machine code, `detail` as the message.

```ts
// auth.interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = this.auth.accessToken;
  return next.handle(token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req);
}
```

---

## 3. TypeScript models

> **Keep write models and read models separate** — records and template fields differ between
> input and output. Do not reuse one for the other.

```ts
// ---- enums ----
export enum FieldType {          // sent & received as NUMBERS
  Text = 0, Number = 1, Date = 2, Boolean = 3, File = 4, Image = 5,
}
export type FolderType = 'Root' | 'System' | 'Normal';   // strings, not enum
export type TreeNodeType = 'Archive' | 'Folder' | 'Template';

// ---- shared value objects ----
export interface FieldValidation {
  required: boolean;
  minLength?: number | null; maxLength?: number | null;
  min?: number | null; max?: number | null;
  regex?: string | null;
}
export interface FieldLayout {
  column: number; order: number; tab?: string | null; width: number;
}

// ================= RESPONSE models (reads) =================
export interface ArchiveResponse {
  id: string; organizationId: string;
  name: string; description: string;
  rootFolder: string;              // ⚠ named "rootFolder" and it's a Guid
  settings: { enableVersioning: boolean; enableAttachments: boolean; enableExport: boolean; enableAudit: boolean };
  createdAt: string;
}
export interface FolderResponse {
  id: string; archiveId: string; parentFolderId: string | null;
  name: string; description: string; type: FolderType; order: number; createdAt: string;
}
export interface ArchiveTreeNode {           // GetFolderTree returns ONE root node
  id: string; name: string; nodeType: TreeNodeType; order: number; children: ArchiveTreeNode[];
}
export interface TemplateResponse {
  id: string; archiveId: string; folderId: string;
  name: string; description: string; currentVersion: number; createdAt: string;
}
export interface TemplateVersionFieldResponse {
  id: string; name: string; label: string; type: FieldType; required: boolean; order: number;
  validation: FieldValidation; layout: FieldLayout;      // always populated on read
}
export interface TemplateVersionResponse {
  id: string; templateId: string; version: number; isPublished: boolean;
  fields: TemplateVersionFieldResponse[]; createdAt: string;
}
export interface RecordFieldValue {          // ⚠ richer than the write DTO
  fieldId: string; fieldName: string; fieldType: FieldType; value: unknown;
}
export interface Attachment {
  recordId: string;
  fileName: { value: string };               // value-object wrappers — unwrap .value
  blobName: { value: string };
  contentType: { mediaType: string; boundary?: string; charSet?: string; name?: string };
  size: number;
  checksum: { value: string };
  uploadedAt: string;
}
export interface RecordResponse {
  id: string; archiveId: string; folderId: string; customerId: string; appointmentId: string | null;
  templateId: string; templateVersionId: string;
  values: RecordFieldValue[]; attachments: Attachment[];
  createdAt: string; updatedAt: string | null;
}

// ================= REQUEST models (writes) =================
export interface CreateArchiveRequest {
  organizationId: string; name: string; description?: string;
  enableVersioning: boolean; enableAttachments: boolean; enableExport: boolean; enableAudit: boolean;
}
export interface UpdateArchiveRequest {       // same minus organizationId
  name: string; description?: string;
  enableVersioning: boolean; enableAttachments: boolean; enableExport: boolean; enableAudit: boolean;
}
export interface CreateFolderRequest {
  parentFolderId: string | null; name: string; description?: string; type?: FolderType; order: number;
}
export interface UpdateFolderRequest { name: string; description?: string; order: number; }

export interface CreateTemplateRequest { folderId: string; name: string; description?: string; }
export interface UpdateTemplateRequest { name: string; description?: string; }

export interface TemplateFieldDto {           // one field definition (write)
  name: string; label: string; type: FieldType; required: boolean; order: number;
  validation?: FieldValidation | null; layout?: FieldLayout | null;   // optional on write
}
export interface CreateTemplateVersionRequest { fields: TemplateFieldDto[]; }

export interface RecordFieldValueDto { fieldName: string; value: unknown; }   // lean write shape
export interface CreateRecordRequest {
  folderId: string; customerId: string; appointmentId: string | null;
  templateId: string; templateVersion: number;   // integer version number
  values: RecordFieldValueDto[];
}
export interface UpdateRecordRequest { values: RecordFieldValueDto[]; }

export interface SearchRecordsParams {
  searchTerm?: string; folderId?: string; fromDate?: string; toDate?: string;   // all optional
}
```

---

## 4. Angular service (all endpoints)

```ts
@Injectable({ providedIn: 'root' })
export class ArchivesApiService {
  private base = `${environment.apiUrl}/api/archives`;
  constructor(private http: HttpClient) {}

  // ---- Phase 1: Archives ----
  createArchive(body: CreateArchiveRequest)                 { return this.http.post<ArchiveResponse>(this.base, body); }
  getArchivesByOrg(organizationId: string)                  { return this.http.get<ArchiveResponse[]>(`${this.base}/organization/${organizationId}`); }
  getArchive(id: string)                                    { return this.http.get<ArchiveResponse>(`${this.base}/${id}`); }
  updateArchive(id: string, body: UpdateArchiveRequest)     { return this.http.put<void>(`${this.base}/${id}`, body); }
  deleteArchive(id: string)                                 { return this.http.delete<void>(`${this.base}/${id}`); }

  // ---- Phase 2: Folders ----
  getFolderTree(archiveId: string)                          { return this.http.get<ArchiveTreeNode>(`${this.base}/${archiveId}/tree`); }
  createFolder(archiveId: string, body: CreateFolderRequest){ return this.http.post<FolderResponse>(`${this.base}/${archiveId}/folders`, body); }
  getFolder(archiveId: string, id: string)                  { return this.http.get<FolderResponse>(`${this.base}/${archiveId}/folders/${id}`); }
  updateFolder(archiveId: string, id: string, body: UpdateFolderRequest) { return this.http.put<void>(`${this.base}/${archiveId}/folders/${id}`, body); }
  deleteFolder(archiveId: string, id: string)               { return this.http.delete<void>(`${this.base}/${archiveId}/folders/${id}`); }

  // ---- Phase 3: Templates & versions ----
  createTemplate(archiveId: string, body: CreateTemplateRequest)          { return this.http.post<TemplateResponse>(`${this.base}/${archiveId}/templates`, body); }
  getTemplatesByFolder(archiveId: string, folderId: string)               { return this.http.get<TemplateResponse[]>(`${this.base}/${archiveId}/folders/${folderId}/templates`); }
  getTemplate(archiveId: string, id: string)                              { return this.http.get<TemplateResponse>(`${this.base}/${archiveId}/templates/${id}`); }
  updateTemplate(archiveId: string, id: string, body: UpdateTemplateRequest) { return this.http.put<void>(`${this.base}/${archiveId}/templates/${id}`, body); }
  deleteTemplate(archiveId: string, id: string)                           { return this.http.delete<void>(`${this.base}/${archiveId}/templates/${id}`); }
  createTemplateVersion(archiveId: string, templateId: string, body: CreateTemplateVersionRequest) { return this.http.post<TemplateVersionResponse>(`${this.base}/${archiveId}/templates/${templateId}/versions`, body); }
  publishTemplateVersion(archiveId: string, templateId: string, versionId: string)                 { return this.http.patch<void>(`${this.base}/${archiveId}/templates/${templateId}/versions/${versionId}/publish`, {}); }
  getTemplateCurrentVersion(archiveId: string, id: string)                { return this.http.get<TemplateVersionResponse>(`${this.base}/${archiveId}/templates/${id}/current-version`); }
  getTemplateVersion(archiveId: string, id: string, version: number)      { return this.http.get<TemplateVersionResponse>(`${this.base}/${archiveId}/templates/${id}/versions/${version}`); }

  // ---- Phase 4: Records ----
  createRecord(archiveId: string, body: CreateRecordRequest)              { return this.http.post<RecordResponse>(`${this.base}/${archiveId}/records`, body); }
  getRecord(archiveId: string, id: string)                                { return this.http.get<RecordResponse>(`${this.base}/${archiveId}/records/${id}`); }
  getRecordsByFolder(archiveId: string, folderId: string)                 { return this.http.get<RecordResponse[]>(`${this.base}/${archiveId}/folders/${folderId}/records`); }
  searchRecords(archiveId: string, p: SearchRecordsParams) {
    let params = new HttpParams();
    if (p.searchTerm) params = params.set('searchTerm', p.searchTerm);
    if (p.folderId)   params = params.set('folderId', p.folderId);
    if (p.fromDate)   params = params.set('fromDate', p.fromDate);
    if (p.toDate)     params = params.set('toDate', p.toDate);
    return this.http.get<RecordResponse[]>(`${this.base}/${archiveId}/records/search`, { params });
  }
  updateRecord(archiveId: string, id: string, body: UpdateRecordRequest)  { return this.http.put<void>(`${this.base}/${archiveId}/records/${id}`, body); }
  deleteRecord(archiveId: string, id: string)                             { return this.http.delete<void>(`${this.base}/${archiveId}/records/${id}`); }
}
```

---

## 5. Endpoint reference — when to use each

### Phase 1 — Archives
| Method | Path | When to use |
|---|---|---|
| POST | `api/archives` | User creates a new archive. Body = `CreateArchiveRequest`. Response includes `rootFolder` — remember it. |
| GET | `api/archives/organization/{organizationId}` | List archives for the current org (archives landing page). |
| GET | `api/archives/{id}` | Open a single archive (header, settings). |
| PUT | `api/archives/{id}` | Edit name/description/feature toggles. Empty response — refetch or update local state. |
| DELETE | `api/archives/{id}` | Delete the archive. |

Creating an archive auto-creates its root folder; `rootFolder` in the response is that folder's id.

### Phase 2 — Folders
| Method | Path | When to use |
|---|---|---|
| GET | `api/archives/{archiveId}/tree` | **Primary navigation.** One call returns the whole archive as a single root node (`nodeType:"Archive"`) with folders and templates nested in `children`. Render the sidebar from this. |
| POST | `api/archives/{archiveId}/folders` | Create a folder. `parentFolderId:null` → nest under root. `type` defaults to `"Normal"`. |
| GET | `api/archives/{archiveId}/folders/{id}` | Fetch one folder's details. |
| PUT | `api/archives/{archiveId}/folders/{id}` | Rename / re-describe / reorder. (Cannot move folder or change type here.) |
| DELETE | `api/archives/{archiveId}/folders/{id}` | Delete a folder. |

### Phase 3 — Templates & versions
| Method | Path | When to use |
|---|---|---|
| POST | `api/archives/{archiveId}/templates` | Create a template shell (name + folder). No fields yet — add them via a version. |
| GET | `api/archives/{archiveId}/folders/{folderId}/templates` | List templates inside a folder. |
| GET | `api/archives/{archiveId}/templates/{id}` | Template header + `currentVersion` number. |
| PUT | `api/archives/{archiveId}/templates/{id}` | Rename / re-describe. |
| DELETE | `api/archives/{archiveId}/templates/{id}` | Delete template. |
| POST | `api/archives/{archiveId}/templates/{templateId}/versions` | Define the field set (`TemplateFieldDto[]`). Created **unpublished**. |
| PATCH | `.../templates/{templateId}/versions/{versionId}/publish` | Publish a version so records can bind to it. Empty response. |
| GET | `.../templates/{id}/current-version` | Get the active published field set — **use this to render a form for creating a record.** |
| GET | `.../templates/{id}/versions/{version}` | Fetch a specific version by its **integer** number (e.g. to display an old record's schema). |

**Template authoring flow:** create template → create version with fields → publish version → then records can use it.

### Phase 4 — Records
| Method | Path | When to use |
|---|---|---|
| POST | `api/archives/{archiveId}/records` | Save a filled form. Bind to a template + `templateVersion` (int) + `folderId` + `customerId`. `values` = lean `{fieldName, value}` pairs. |
| GET | `api/archives/{archiveId}/records/{id}` | Open one record. Response `values` are the **rich** shape (`fieldId/fieldName/fieldType/value`). |
| GET | `api/archives/{archiveId}/folders/{folderId}/records` | List records in a folder. |
| GET | `api/archives/{archiveId}/records/search` | Filtered list. Query params: `searchTerm`, `folderId`, `fromDate`, `toDate` (all optional). |
| PUT | `api/archives/{archiveId}/records/{id}` | Update values (replaces the values list). |
| DELETE | `api/archives/{archiveId}/records/{id}` | Delete a record. |

---

## 6. Recommended UI build order

1. **Archives list & CRUD** (Phase 1) — get an archive selected and its `id` in hand.
2. **Folder tree** (`GET /tree`) as the main nav, plus folder create/rename/delete.
3. **Templates**: list per folder, create template → **version editor** (build `TemplateFieldDto[]`) → **publish**.
4. **Records**: from a published template, fetch `current-version`, render a dynamic form from
   `fields`, submit as a record; then list/search/view/edit records.

Dynamic form rendering: drive inputs off `TemplateVersionFieldResponse` — switch on `type`
(`FieldType`), apply `validation` (required/min/max/length/regex), and lay out using `layout`
(`column`, `order`, `tab`, `width`).

---

## 7. Gotchas (read before coding)

1. **Enums are numbers.** `FieldType` is `0..5` on the wire, not strings. Map both ways.
2. **Record read ≠ record write.** You send `{ fieldName, value }`; you receive
   `{ fieldId, fieldName, fieldType, value }`. Separate models.
3. **`rootFolder`** on `ArchiveResponse` is a Guid named `rootFolder` (not `rootFolderId`).
4. **Folder `type` / tree `nodeType` are strings** (`"Root"|"System"|"Normal"`, `"Archive"|"Folder"|"Template"`).
5. **Attachments use wrapper objects:** `fileName`, `blobName`, `checksum` come as `{ value }`;
   `contentType` as `{ mediaType, ... }`. Unwrap in a mapper.
6. **Publish before use.** A record can only bind to a **published** template version. Newly created
   versions are `isPublished: false`.
7. **Empty bodies** on PUT/DELETE/PATCH-publish — don't try to parse a response; refetch or patch local state.
8. **`templateVersion` is the integer version number**, not the version's Guid. (The publish endpoint,
   by contrast, takes the version's `versionId` Guid in the path.)

---

*Scope: Archives module only. The Forms module (`/api/service/form/...`, `/api/form/submission/...`)
is a separate feature — ask if you want its integration plan added here.*
