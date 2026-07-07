# MedCare Plus REST API v1 Specification

All API endpoints are prefixed with `/api/v1`. Access tokens must be passed in headers as `Authorization: Bearer <accessToken>`, except for download routes which verify tokens via query parameters.

---

## 1. Authentication & Profile Security (`/api/v1/auth`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Self-registers a patient user and patient profile | Public |
| **POST** | `/login` | Authenticates email/password (rate-limited, max 5 attempts/15m). Sets HTTP-only refresh cookie. | Public |
| **POST** | `/logout` | Revokes active cookies and logs out user | Private |
| **POST** | `/refresh` | Generates a new access token using secure refresh token rotation | Public |
| **POST** | `/forgot-password` | Generates recovery token and logs link details | Public |
| **POST** | `/reset-password` | Submits new password using valid recovery token | Public |
| **GET** | `/me` | Retrieves the profile details of the active user | Private |
| **PATCH**| `/update-profile` | Updates active user's name and phone number | Private |
| **PATCH**| `/update-password` | Updates active user's password (requires current password validation) | Private |
| **POST** | `/avatar` | Uploads profile photo avatar (`avatar` form field, JPG/PNG only, max 5MB) | Private |

---

## 2. Patient Directory (`/api/v1/patients`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists all patients (supports query params: `search`, `gender`, `bloodGroup`, `page`, `limit`) | Admin, Doctor, Receptionist, Nurse |
| **GET** | `/me` | Retrieves the clinical patient profile of the logged-in patient user | Patient |
| **GET** | `/:id` | Retrieves a single patient's demographic information | Admin, Doctor, Receptionist, Nurse |
| **POST** | `/` | Creates a patient profile manually | Admin, Receptionist, Doctor, Nurse |
| **PATCH**| `/:id` | Updates patient information | Admin, Receptionist, Doctor, Nurse |
| **DELETE**| `/:id` | Deletes patient profile and their linked user login credentials | Admin |

---

## 3. Doctors & Departments (`/api/v1/doctors`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists all clinic doctors, populating user details | All authenticated roles |
| **GET** | `/departments` | Lists all hospital departments and heads | All authenticated roles |
| **GET** | `/:id` | Retrieves single doctor's schedules and fee information | All authenticated roles |
| **POST** | `/` | Registers a doctor user and profile | Admin |
| **PATCH**| `/:id` | Updates doctor specialization, fees, or phone contacts | Admin |
| **DELETE**| `/:id` | Deletes doctor profile and their user login | Admin |

---

## 4. Appointments Scheduling (`/api/v1/appointments`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists all scheduled visits (supports query params: `doctor`, `patient`, `date`, `status`) | Admin, Doctor, Receptionist, Nurse |
| **GET** | `/my-appointments` | Lists own appointments booked | Patient |
| **GET** | `/available-slots` | Queries available slots for a doctor on a specific date (YYYY-MM-DD) | All authenticated roles |
| **POST** | `/` | Schedules/books an appointment (validates doctor schedule & checks double-bookings) | Patient, Admin, Receptionist, Doctor |
| **PATCH**| `/:id/status` | Updates appointment status (`pending`, `confirmed`, `completed`, `cancelled`) | Admin, Receptionist, Doctor, Nurse |

---

## 5. Clinical EMR (`/api/v1/medical-records`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists patient clinical checkups | Admin, Doctor, Nurse |
| **GET** | `/my-records` | Lists own medical records | Patient |
| **POST** | `/` | Registers a medical record diagnosis (`attachments` upload fields, max 5MB) | Doctor |
| **PATCH**| `/:id` | Updates diagnosis or treatment recommendations | Doctor |

---

## 6. Prescriptions (`/api/v1/prescriptions`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists active prescription slips | Admin, Doctor, Pharmacist |
| **GET** | `/my-prescriptions` | Lists own prescription history | Patient |
| **POST** | `/` | Issues a prescription, completes appointment, and generates a billing invoice | Doctor |

---

## 7. Pharmacy Inventory (`/api/v1/pharmacy`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/medicines` | Lists medicine catalog names and categories | Admin, Doctor, Pharmacist |
| **POST** | `/medicines` | Configures new medicine metadata and reorder thresholds | Admin, Pharmacist |
| **GET** | `/inventory` | Lists pharmacy batch codes, stock levels, and supplier tags | Admin, Pharmacist |
| **POST** | `/inventory` | Replenishes batch stock (emails low-stock alerts if total is under threshold) | Admin, Pharmacist |

---

## 8. Laboratory Diagnostics (`/api/v1/laboratory`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists laboratory tests ordered | Admin, Doctor, Lab |
| **GET** | `/my-tests` | Lists own laboratory test reports | Patient |
| **POST** | `/` | Orders a lab test for a patient | Admin, Doctor, Lab |
| **PATCH**| `/:id/status` | Updates lab analysis stages (`ordered`, `in-progress`, `completed`) | Admin, Lab |
| **POST** | `/:id/results` | Uploads PDF result file (`resultFile` field, max 5MB). Completes lab test. | Admin, Lab |

---

## 9. Billing & Invoicing (`/api/v1/billing`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists clinic statement statements | Admin, Receptionist |
| **GET** | `/my-bills` | Lists own bills | Patient |
| **POST** | `/` | Creates patient invoice manually with itemized line items | Admin, Receptionist |
| **POST** | `/:id/pay` | Records bill payments (cash, card, insurance, other) | Admin, Receptionist, Patient |
| **GET** | `/:id/pdf` | Streams generated official PDF receipt using PDFKit (token passed as query param) | Private |

---

## 10. Staff Directory (`/api/v1/staff`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists hospital staff accounts (non-patients) | Admin |
| **POST** | `/` | Registers a staff user (receptionist, nurse, lab, pharmacist, admin) | Admin |
| **PATCH**| `/:id/toggle-active` | Toggles staff user's active/deactivated login permissions | Admin |

---

## 11. Reports & Operational Audits (`/api/v1/reports`)

| Method | Route | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/metrics` | Retrieves aggregated patient/doctor/revenue operational metrics | Admin, Doctor, Receptionist, Nurse, Lab, Pharmacist |
| **GET** | `/activity-logs` | Retrieves recent audit feeds of hospital activities | Admin, Staff |
| **GET** | `/export/excel` | Streams entire appointments ledger as Excel sheet using ExcelJS (token query parameter) | Admin, Staff |
| **GET** | `/export/pdf` | Streams operational summary details as PDF document using PDFKit (token query parameter) | Admin, Staff |
