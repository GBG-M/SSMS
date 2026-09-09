from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from accounts.models import Role, ParentProfile
from students.models import Student
from .models import FeeType, FeeStructure, StudentFee, Invoice, Payment
from .permissions import FinanceAccessPermission

User = get_user_model()


class FinanceCoreModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@ssms.test',
            username='admin',
            password='StrongPass123',
            first_name='Admin',
            last_name='User',
        )

        self.student = Student.objects.create(
            student_id='STU-001',
            first_name='Jane',
            last_name='Doe',
            date_of_birth='2008-06-12',
            gender='FEMALE',
            email='jane.doe@ssms.test',
            phone_number='09000000001',
            address='Test Address',
            emergency_contact_name='John Doe',
            emergency_contact_phone='09000000002',
            current_grade='Grade 10',
            current_class='Class A',
            academic_year='2025/2026',
            guardian_name='John Doe',
            guardian_relationship='Father',
            guardian_phone='09000000002',
        )

    def test_student_fee_calculates_outstanding_balance(self):
        fee_type = FeeType.objects.create(
            name='Tuition',
            category='tuition',
            amount=Decimal('2500.00'),
            is_required=True,
            academic_year='2025/2026',
        )
        fee = StudentFee.objects.create(
            student=self.student,
            fee_type=fee_type,
            amount_due=Decimal('2500.00'),
            amount_paid=Decimal('1000.00'),
            academic_year='2025/2026',
            due_date='2025-09-15',
        )

        self.assertEqual(fee.outstanding_balance, Decimal('1500.00'))
        self.assertEqual(fee.status, 'partial')

    def test_invoice_balance_updates_after_payment(self):
        invoice = Invoice.objects.create(
            student=self.student,
            issued_by=self.user,
            subtotal=Decimal('6000.00'),
            tax=Decimal('300.00'),
            total_amount=Decimal('6300.00'),
            status='pending',
            due_date='2025-09-15',
        )

        payment = Payment.objects.create(
            invoice=invoice,
            student=self.student,
            amount=Decimal('2000.00'),
            payment_method='bank_transfer',
            payment_date='2025-09-10',
            received_by=self.user,
        )

        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal('2000.00'))
        self.assertEqual(invoice.balance, Decimal('4300.00'))
        self.assertEqual(payment.status, 'completed')


class FinancePermissionTests(TestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name=Role.ADMIN)
        self.student_role = Role.objects.create(name=Role.STUDENT)
        self.parent_role = Role.objects.create(name=Role.PARENT)

        self.admin = User.objects.create_user(
            email='finance-admin@ssms.test',
            username='finance-admin',
            password='StrongPass123',
        )
        self.admin.roles.add(self.admin_role)

        self.student_user = User.objects.create_user(
            email='student@ssms.test',
            username='student',
            password='StrongPass123',
        )
        self.student_user.roles.add(self.student_role)

        self.other_student = Student.objects.create(
            student_id='STU-002',
            first_name='Other',
            last_name='Student',
            date_of_birth='2009-01-01',
            gender='MALE',
            email='other.student@ssms.test',
            phone_number='09000000003',
            address='Other Address',
            emergency_contact_name='Guardian',
            emergency_contact_phone='09000000004',
            current_grade='Grade 11',
            current_class='Class B',
            academic_year='2025/2026',
            guardian_name='Guardian',
            guardian_relationship='Mother',
            guardian_phone='09000000004',
        )

        self.student = Student.objects.create(
            student_id='STU-001',
            first_name='Jane',
            last_name='Doe',
            date_of_birth='2008-06-12',
            gender='FEMALE',
            email='jane.doe@ssms.test',
            phone_number='09000000001',
            address='Test Address',
            emergency_contact_name='John Doe',
            emergency_contact_phone='09000000002',
            current_grade='Grade 10',
            current_class='Class A',
            academic_year='2025/2026',
            guardian_name='John Doe',
            guardian_relationship='Father',
            guardian_phone='09000000002',
            user=self.student_user,
        )

        self.parent_user = User.objects.create_user(
            email='parent@ssms.test',
            username='parent',
            password='StrongPass123',
        )
        self.parent_user.roles.add(self.parent_role)

        self.parent_profile = ParentProfile.objects.create(
            user=self.parent_user,
            phone_number='09000000099',
            relationship='Father',
            is_primary=True,
        )
        self.parent_profile.students.add(self.student)

        self.fee = StudentFee.objects.create(
            student=self.student,
            fee_type=FeeType.objects.create(
                name='Tuition',
                category='tuition',
                amount='2500.00',
                is_required=True,
                academic_year='2025/2026',
            ),
            amount_due='2500.00',
            due_date='2025-09-15',
            academic_year='2025/2026',
        )

    def test_student_can_only_view_own_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.student_user, 'method': 'GET'})()
        self.assertTrue(permission.has_object_permission(request, None, self.fee))
        self.assertFalse(permission.has_object_permission(request, None, StudentFee.objects.create(
            student=self.other_student,
            fee_type=FeeType.objects.create(
                name='Other Tuition',
                category='tuition',
                amount='2000.00',
                is_required=True,
                academic_year='2025/2026',
            ),
            amount_due='2000.00',
            due_date='2025-09-15',
            academic_year='2025/2026',
        )))

    def test_parent_can_only_view_child_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.parent_user, 'method': 'GET'})()
        self.assertTrue(permission.has_object_permission(request, None, self.fee))

        other_fee = StudentFee.objects.create(
            student=self.other_student,
            fee_type=FeeType.objects.create(
                name='Other Tuition',
                category='tuition',
                amount='2000.00',
                is_required=True,
                academic_year='2025/2026',
            ),
            amount_due='2000.00',
            due_date='2025-09-15',
            academic_year='2025/2026',
        )
        self.assertFalse(permission.has_object_permission(request, None, other_fee))

    def test_admin_has_full_access_to_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.admin, 'method': 'GET'})()
        self.assertTrue(permission.has_object_permission(request, None, self.fee))

    def test_admin_can_mutate_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.admin, 'method': 'POST'})()
        self.assertTrue(permission.has_permission(request, None))

    def test_student_cannot_mutate_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.student_user, 'method': 'POST'})()
        self.assertFalse(permission.has_permission(request, None))

    def test_parent_cannot_mutate_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.parent_user, 'method': 'POST'})()
        self.assertFalse(permission.has_permission(request, None))

    def test_student_cannot_modify_existing_fee_record(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.student_user, 'method': 'PATCH'})()
        self.assertFalse(permission.has_object_permission(request, None, self.fee))

    def test_student_can_read_finance_records(self):
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': self.student_user, 'method': 'GET'})()
        self.assertTrue(permission.has_permission(request, None))

    def test_academic_coordinator_can_read_student_finance_records(self):
        coord_role = Role.objects.create(name=Role.ACADEMIC_COORDINATOR)
        coord_user = User.objects.create_user(
            email='coordinator@ssms.test',
            username='coordinator',
            password='StrongPass123',
        )
        coord_user.roles.add(coord_role)
        permission = FinanceAccessPermission()
        request = type('Request', (), {'user': coord_user, 'method': 'GET'})()
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.fee))


class FinanceCoreModelEnhancementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin2@ssms.test',
            username='admin2',
            password='StrongPass123',
        )
        self.student = Student.objects.create(
            student_id='STU-099',
            first_name='Alex',
            last_name='Smith',
            date_of_birth='2008-01-01',
            gender='MALE',
            email='alex.smith@ssms.test',
            phone_number='09000000010',
            address='Test Address',
            emergency_contact_name='Parent',
            emergency_contact_phone='09000000011',
            current_grade='Grade 10',
            current_class='Class A',
            academic_year='2025/2026',
            guardian_name='Parent',
            guardian_relationship='Mother',
            guardian_phone='09000000011',
        )

    def test_student_fee_preserves_waived_status(self):
        fee_type = FeeType.objects.create(
            name='Registration Fee',
            category='miscellaneous',
            amount=Decimal('300.00'),
            academic_year='2025/2026',
        )
        fee = StudentFee.objects.create(
            student=self.student,
            fee_type=fee_type,
            amount_due=Decimal('300.00'),
            due_date='2025-09-15',
            academic_year='2025/2026',
            status='waived',
        )
        fee.refresh_from_db()
        self.assertEqual(fee.status, 'waived')

    def test_invoice_auto_calculates_total_amount(self):
        invoice = Invoice.objects.create(
            student=self.student,
            issued_by=self.user,
            subtotal=Decimal('1500.00'),
            tax=Decimal('150.00'),
            due_date='2025-10-01',
        )
        self.assertEqual(invoice.total_amount, Decimal('1650.00'))

    def test_payment_deletion_recalculates_invoice_balance(self):
        future_due = timezone.localdate() + timedelta(days=30)
        invoice = Invoice.objects.create(
            student=self.student,
            issued_by=self.user,
            subtotal=Decimal('3000.00'),
            total_amount=Decimal('3000.00'),
            due_date=future_due,
        )
        payment = Payment.objects.create(
            invoice=invoice,
            student=self.student,
            amount=Decimal('1000.00'),
            payment_method='cash',
            received_by=self.user,
        )
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal('1000.00'))
        self.assertEqual(invoice.balance, Decimal('2000.00'))

        # Delete payment and verify balance is restored
        payment.delete()
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal('0.00'))
        self.assertEqual(invoice.balance, Decimal('3000.00'))
        self.assertEqual(invoice.status, 'pending')


class FinanceViewSetAPITests(TestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name=Role.ADMIN)
        self.coord_role = Role.objects.create(name=Role.ACADEMIC_COORDINATOR)

        # Staff user without Role.ADMIN
        self.staff_user = User.objects.create_user(
            email='staff@ssms.test',
            username='staff',
            password='StrongPass123',
            is_staff=True,
        )

        # Coordinator user
        self.coord_user = User.objects.create_user(
            email='coord@ssms.test',
            username='coord',
            password='StrongPass123',
        )
        self.coord_user.roles.add(self.coord_role)

        self.student = Student.objects.create(
            student_id='STU-100',
            first_name='Tommy',
            last_name='Hilfiger',
            date_of_birth='2007-05-10',
            gender='MALE',
            email='tommy@ssms.test',
            phone_number='09000000020',
            address='Address',
            emergency_contact_name='Guardian',
            emergency_contact_phone='09000000021',
            current_grade='Grade 12',
            current_class='Class C',
            academic_year='2025/2026',
            guardian_name='Guardian',
            guardian_relationship='Uncle',
            guardian_phone='09000000021',
        )

        self.fee_type = FeeType.objects.create(
            name='Library Fee',
            category='library',
            amount=Decimal('120.00'),
            academic_year='2025/2026',
        )

        self.student_fee = StudentFee.objects.create(
            student=self.student,
            fee_type=self.fee_type,
            amount_due=Decimal('120.00'),
            due_date='2025-09-30',
            academic_year='2025/2026',
        )

        self.invoice = Invoice.objects.create(
            student=self.student,
            issued_by=self.staff_user,
            subtotal=Decimal('500.00'),
            total_amount=Decimal('500.00'),
            due_date='2025-09-30',
        )

        self.payment = Payment.objects.create(
            invoice=self.invoice,
            student=self.student,
            amount=Decimal('200.00'),
            payment_method='bank_transfer',
            received_by=self.staff_user,
        )

    def test_staff_user_can_access_finance_querysets(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.staff_user)

        # Student fees list
        res_fees = client.get('/api/finance/student-fees/')
        self.assertEqual(res_fees.status_code, 200)
        self.assertGreaterEqual(len(res_fees.data), 1)

        # Invoices list
        res_inv = client.get('/api/finance/invoices/')
        self.assertEqual(res_inv.status_code, 200)
        self.assertGreaterEqual(len(res_inv.data), 1)

        # Payments list
        res_pay = client.get('/api/finance/payments/')
        self.assertEqual(res_pay.status_code, 200)
        self.assertGreaterEqual(len(res_pay.data), 1)

    def test_coordinator_can_access_finance_querysets(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.coord_user)

        res_fees = client.get('/api/finance/student-fees/')
        self.assertEqual(res_fees.status_code, 200)
        self.assertGreaterEqual(len(res_fees.data), 1)

    def test_invoice_summary_endpoint(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.staff_user)

        res = client.get('/api/finance/invoices/summary/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('total_invoiced', res.data)
        self.assertIn('total_paid', res.data)
        self.assertIn('outstanding_balance', res.data)
        self.assertGreaterEqual(res.data['total_invoiced'], Decimal('500.00'))
