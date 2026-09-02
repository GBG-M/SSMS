# Finance API Contract

Base URL: `/api/finance/`

Authentication:
- All endpoints require `Authorization: Token <token>`
- This project is using DRF Token Authentication

Role rules:
- Admin: full access to all finance records
- Student: access only their own records
- Parent: access only records for their linked children

## 1) Fee Types

### GET /api/finance/fee-types/
Returns all fee types.

Example response:
```json
[
  {
    "id": "d9d5b137-5c06-4bb3-bd3f-6d63a7f5f5d1",
    "name": "Tuition",
    "category": "tuition",
    "description": "Annual school tuition",
    "amount": "2500.00",
    "is_required": true,
    "academic_year": "2025/2026",
    "is_active": true,
    "created_at": "2025-09-01T10:00:00Z",
    "updated_at": "2025-09-01T10:00:00Z"
  }
]
```

### POST /api/finance/fee-types/
Create a new fee type.

Request body:
```json
{
  "name": "Library Fee",
  "category": "library",
  "description": "Library usage fee",
  "amount": "150.00",
  "is_required": true,
  "academic_year": "2025/2026",
  "is_active": true
}
```

---

## 2) Fee Structures

### GET /api/finance/fee-structures/
Returns fee structures.

Example:
```json
[
  {
    "id": "c4f1d8e2-0a3b-4db0-ace8-9cc101ff8f25",
    "fee_type": "d9d5b137-5c06-4bb3-bd3f-6d63a7f5f5d1",
    "grade_level": "Grade 10",
    "class_name": "Class A",
    "program": "Science",
    "amount": "2500.00",
    "due_date": "2025-09-15",
    "recurrence": "yearly",
    "academic_year": "2025/2026",
    "is_active": true
  }
]
```

---

## 3) Student Fees

### GET /api/finance/student-fees/
Returns fee records for the logged-in user scope.

Query params:
- `student` = student id
- `fee_type` = fee type id
- `status` = pending|partial|paid|overdue|waived
- `academic_year`

Example response:
```json
[
  {
    "id": "77a0be18-3638-4b7a-8c95-26d9d0d73c2f",
    "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
    "student_name": "Jane Doe",
    "fee_type": "d9d5b137-5c06-4bb3-bd3f-6d63a7f5f5d1",
    "fee_name": "Tuition",
    "fee_structure": null,
    "amount_due": "2500.00",
    "amount_paid": "1000.00",
    "outstanding_balance": "1500.00",
    "due_date": "2025-09-15",
    "academic_year": "2025/2026",
    "status": "partial",
    "created_at": "2025-09-01T10:05:00Z",
    "updated_at": "2025-09-01T10:05:00Z"
  }
]
```

### POST /api/finance/student-fees/
Create a student fee entry.

Request body:
```json
{
  "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
  "fee_type": "d9d5b137-5c06-4bb3-bd3f-6d63a7f5f5d1",
  "fee_structure": null,
  "amount_due": "2500.00",
  "amount_paid": "0.00",
  "due_date": "2025-09-15",
  "academic_year": "2025/2026"
}
```

---

## 4) Invoices

### GET /api/finance/invoices/
Returns invoices for the allowed student scope.

Example response:
```json
[
  {
    "id": "fb26b2ce-90b3-4ade-9259-7ab9921930ed",
    "invoice_number": "INV-20250901-AB12CD34",
    "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
    "student_name": "Jane Doe",
    "issued_by": "50b51fae-284d-4f3d-8d0e-6f0ee6cc1d8d",
    "issue_date": "2025-09-01",
    "due_date": "2025-09-15",
    "subtotal": "6000.00",
    "tax": "300.00",
    "total_amount": "6300.00",
    "paid_amount": "2000.00",
    "balance": "4300.00",
    "status": "partial",
    "notes": "Term fee invoice"
  }
]
```

### POST /api/finance/invoices/
Create a new invoice.

Request body:
```json
{
  "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
  "issued_by": "50b51fae-284d-4f3d-8d0e-6f0ee6cc1d8d",
  "due_date": "2025-09-15",
  "subtotal": "6000.00",
  "tax": "300.00",
  "total_amount": "6300.00",
  "paid_amount": "0.00",
  "status": "pending",
  "notes": "Term fee invoice"
}
```

---

## 5) Payments

### GET /api/finance/payments/
Returns payment history.

Example response:
```json
[
  {
    "id": "0fd3e6c6-bd6d-4136-9aaf-6b5dcd7b07c7",
    "invoice": "fb26b2ce-90b3-4ade-9259-7ab9921930ed",
    "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
    "student_name": "Jane Doe",
    "amount": "2000.00",
    "payment_method": "bank_transfer",
    "transaction_reference": "TXN-20250901-001",
    "payment_date": "2025-09-10",
    "status": "completed",
    "notes": "Tuition deposit",
    "received_by": "50b51fae-284d-4f3d-8d0e-6f0ee6cc1d8d"
  }
]
```

### POST /api/finance/payments/
Record a payment.

Request body:
```json
{
  "invoice": "fb26b2ce-90b3-4ade-9259-7ab9921930ed",
  "student": "8d7a72d7-aee9-4e84-a2cc-e47915d7d52d",
  "amount": "2000.00",
  "payment_method": "bank_transfer",
  "transaction_reference": "TXN-20250901-001",
  "payment_date": "2025-09-10",
  "status": "completed",
  "notes": "Tuition deposit",
  "received_by": "50b51fae-284d-4f3d-8d0e-6f0ee6cc1d8d"
}
```

---

## Response behavior notes
- `outstanding_balance` is calculated as `amount_due - amount_paid`, never below `0.00`
- invoice `balance` is calculated as `total_amount - paid_amount`
- student and parent views automatically filter to allowed records
- admin role can manage all finance resources directly

## Recommended frontend usage
- Use `GET /api/finance/student-fees/?student=<id>` when loading a student account
- Use `GET /api/finance/invoices/?student=<id>` for a student’s invoice list
- Use `GET /api/finance/payments/?student=<id>` for ledger history
- Use `POST /api/finance/payments/` for successful payments

This contract is designed to match the current backend implementation in [finance/views.py](finance/views.py) and [finance/serializers.py](finance/serializers.py).
