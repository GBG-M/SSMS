from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

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
