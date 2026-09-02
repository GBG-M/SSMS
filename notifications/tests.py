import uuid
from datetime import date, time
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from students.models import Student, Attendance
from academics.models import AcademicYear, Subject, ClassSection, Enrollment, Assessment, GradeRecord
from scheduling.models import Room, ClassSchedule, ExamSchedule
from finance.models import FeeType, StudentFee, Invoice, Payment
from notifications.models import Notification
from notifications.services import (
    create_notification,
    notify_student_and_parents,
    notify_class_section,
)


class NotificationModelAndAccessTests(APITestCase):

    def setUp(self):
        # Roles
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.role_teacher, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.role_student, _ = Role.objects.get_or_create(name=Role.STUDENT)
        self.role_parent, _ = Role.objects.get_or_create(name=Role.PARENT)

        # Admin User
        self.admin = User.objects.create_user(
            email='admin@ssms.test',
            username='admin_user',
            password='Password123!',
            first_name='Admin',
            last_name='User'
        )
        self.admin.roles.add(self.role_admin)

        # Teacher User
        self.teacher = User.objects.create_user(
            email='teacher@ssms.test',
            username='teacher_user',
            password='Password123!',
            first_name='Professor',
            last_name='Oak'
        )
        self.teacher.roles.add(self.role_teacher)

        # Student User & Record
        self.student_user = User.objects.create_user(
            email='student1@ssms.test',
            username='student1',
            password='Password123!',
            first_name='Ash',
            last_name='Ketchum'
        )
        self.student_user.roles.add(self.role_student)

        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU-001',
            first_name='Ash',
            last_name='Ketchum',
            date_of_birth=date(2008, 5, 22),
            gender='MALE',
            email='student1@ssms.test',
            phone_number='1234567890',
            address='Pallet Town',
            emergency_contact_name='Delia Ketchum',
            emergency_contact_phone='0987654321',
            current_grade='10',
            current_class='Science A',
            academic_year='2025/2026',
            guardian_name='Delia Ketchum',
            guardian_relationship='Mother',
            guardian_phone='0987654321',
            status='ACTIVE'
        )

        # Parent User & Profile
        self.parent_user = User.objects.create_user(
            email='parent1@ssms.test',
            username='parent1',
            password='Password123!',
            first_name='Delia',
            last_name='Ketchum'
        )
        self.parent_user.roles.add(self.role_parent)
        self.parent_profile = ParentProfile.objects.create(
            user=self.parent_user,
            phone_number='0987654321',
            relationship='Mother'
        )
        self.parent_profile.students.add(self.student)

        # Unrelated Student & Parent
        self.unrelated_user = User.objects.create_user(
            email='unrelated@ssms.test',
            username='unrelated',
            password='Password123!',
            first_name='Gary',
            last_name='Oak'
        )
        self.unrelated_user.roles.add(self.role_student)

        self.list_url = reverse('notifications-api:notification-list')

    def test_notification_model_creation_and_helpers(self):
        notif = create_notification(
            recipient=self.student_user,
            title='Test Notice',
            message='Welcome to SSMS notifications',
            notification_type='SYSTEM_ALERT',
            priority='NORMAL',
            related_student=self.student
        )
        self.assertEqual(notif.recipient, self.student_user)
        self.assertEqual(notif.recipient_role, Role.STUDENT)
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)

        # Test mark as read
        notif.mark_as_read()
        self.assertTrue(notif.is_read)
        self.assertIsNotNone(notif.read_at)

        # Test mark as unread
        notif.mark_as_unread()
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)

    def test_student_can_only_see_own_notifications(self):
        # Create notice for student 1
        notif1 = create_notification(
            recipient=self.student_user,
            title='For Student 1',
            message='Message 1',
        )
        # Create notice for unrelated user
        notif2 = create_notification(
            recipient=self.unrelated_user,
            title='For Unrelated Student',
            message='Message 2',
        )

        self.client.force_authenticate(user=self.student_user)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        ids = [item['id'] for item in results]

        self.assertIn(str(notif1.id), ids)
        self.assertNotIn(str(notif2.id), ids)

    def test_parent_sees_own_and_child_notifications(self):
        # Notification directly to parent
        notif_parent = create_notification(
            recipient=self.parent_user,
            title='Parent Notice',
            message='Parent message',
            related_student=self.student
        )
        # Notification to student
        notif_child = create_notification(
            recipient=self.student_user,
            title='Child Notice',
            message='Child message',
            related_student=self.student
        )
        # Notification to unrelated user
        notif_other = create_notification(
            recipient=self.unrelated_user,
            title='Other Student Notice',
            message='Other message',
        )

        self.client.force_authenticate(user=self.parent_user)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        ids = [item['id'] for item in results]

        self.assertIn(str(notif_parent.id), ids)
        self.assertIn(str(notif_child.id), ids)
        self.assertNotIn(str(notif_other.id), ids)

    def test_admin_can_view_all_notifications(self):
        notif1 = create_notification(recipient=self.student_user, title='Notice 1', message='M1')
        notif2 = create_notification(recipient=self.unrelated_user, title='Notice 2', message='M2')

        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        ids = [item['id'] for item in results]

        self.assertIn(str(notif1.id), ids)
        self.assertIn(str(notif2.id), ids)


class NotificationAPIActionsTests(APITestCase):

    def setUp(self):
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.role_teacher, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.role_student, _ = Role.objects.get_or_create(name=Role.STUDENT)

        self.teacher = User.objects.create_user(
            email='teacher@ssms.test',
            username='teacher1',
            password='Password123!',
            first_name='Prof',
            last_name='Oak'
        )
        self.teacher.roles.add(self.role_teacher)

        self.student_user = User.objects.create_user(
            email='student@ssms.test',
            username='student1',
            password='Password123!',
            first_name='Ash',
            last_name='K'
        )
        self.student_user.roles.add(self.role_student)

        self.notif = create_notification(
            recipient=self.student_user,
            title='Class Rescheduled',
            message='Class has moved to room 102',
            notification_type='CLASS_SCHEDULE_CHANGED',
            priority='HIGH'
        )

        self.list_url = reverse('notifications-api:notification-list')
        self.detail_url = reverse('notifications-api:notification-detail', kwargs={'pk': self.notif.pk})
        self.mark_read_url = reverse('notifications-api:notification-mark-read', kwargs={'pk': self.notif.pk})
        self.mark_unread_url = reverse('notifications-api:notification-mark-unread', kwargs={'pk': self.notif.pk})
        self.mark_all_read_url = reverse('notifications-api:notification-mark-all-read')
        self.unread_count_url = reverse('notifications-api:notification-unread-count')

    def test_mark_read_and_unread_actions(self):
        self.client.force_authenticate(user=self.student_user)

        # 1. Check unread count
        count_res = self.client.get(self.unread_count_url)
        self.assertEqual(count_res.status_code, status.HTTP_200_OK)
        self.assertEqual(count_res.data['unread_count'], 1)

        # 2. Mark as read
        read_res = self.client.post(self.mark_read_url)
        self.assertEqual(read_res.status_code, status.HTTP_200_OK)
        self.assertTrue(read_res.data['notification']['is_read'])

        # 3. Check unread count is 0
        count_res2 = self.client.get(self.unread_count_url)
        self.assertEqual(count_res2.data['unread_count'], 0)

        # 4. Mark as unread
        unread_res = self.client.post(self.mark_unread_url)
        self.assertEqual(unread_res.status_code, status.HTTP_200_OK)
        self.assertFalse(unread_res.data['notification']['is_read'])

    def test_mark_all_read_action(self):
        self.client.force_authenticate(user=self.student_user)
        create_notification(recipient=self.student_user, title='N2', message='M2')
        create_notification(recipient=self.student_user, title='N3', message='M3')

        res = self.client.post(self.mark_all_read_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 3)

        count_res = self.client.get(self.unread_count_url)
        self.assertEqual(count_res.data['unread_count'], 0)

    def test_teacher_create_notification(self):
        self.client.force_authenticate(user=self.teacher)
        payload = {
            'recipient_id': str(self.student_user.id),
            'title': 'Homework Reminder',
            'message': 'Please bring your project tomorrow.',
            'notification_type': 'TEACHER_MESSAGE',
            'priority': 'NORMAL'
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Homework Reminder')
        self.assertEqual(res.data['sender_name'], self.teacher.full_name)

    def test_student_cannot_create_notification(self):
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'recipient_id': str(self.teacher.id),
            'title': 'Test',
            'message': 'Test'
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class NotificationSignalTriggersTests(APITestCase):

    def setUp(self):
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.role_teacher, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.role_student, _ = Role.objects.get_or_create(name=Role.STUDENT)
        self.role_parent, _ = Role.objects.get_or_create(name=Role.PARENT)

        self.academic_year = AcademicYear.objects.create(
            name='2025/2026',
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            is_active=True
        )
        self.subject = Subject.objects.create(
            code='SCI101',
            name='General Science',
            credit_hours=3
        )
        self.teacher = User.objects.create_user(
            email='science_teacher@ssms.test',
            username='sci_teacher',
            password='Password123!',
            first_name='Albert',
            last_name='Einstein'
        )
        self.teacher.roles.add(self.role_teacher)

        self.student_user = User.objects.create_user(
            email='student_sig@ssms.test',
            username='student_sig',
            password='Password123!',
            first_name='Marie',
            last_name='Curie'
        )
        self.student_user.roles.add(self.role_student)

        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU-SIG-001',
            first_name='Marie',
            last_name='Curie',
            date_of_birth=date(2009, 11, 7),
            gender='FEMALE',
            email='student_sig@ssms.test',
            phone_number='1122334455',
            address='Science Ave',
            emergency_contact_name='Pierre Curie',
            emergency_contact_phone='5544332211',
            current_grade='10',
            current_class='Science 10A',
            academic_year='2025/2026',
            guardian_name='Pierre Curie',
            guardian_relationship='Father',
            guardian_phone='5544332211',
            status='ACTIVE'
        )

        self.parent_user = User.objects.create_user(
            email='parent_sig@ssms.test',
            username='parent_sig',
            password='Password123!',
            first_name='Pierre',
            last_name='Curie'
        )
        self.parent_user.roles.add(self.role_parent)
        self.parent_profile = ParentProfile.objects.create(
            user=self.parent_user,
            phone_number='5544332211',
            relationship='Father'
        )
        self.parent_profile.students.add(self.student)

        self.room = Room.objects.create(
            name='Lab 1',
            room_number='LAB-101',
            capacity=30
        )
        self.class_section = ClassSection.objects.create(
            section_code='SCI-10A',
            name='Science 10-A',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.teacher,
            capacity=30
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            class_section=self.class_section,
            status='ACTIVE'
        )

    def test_grade_posted_signal_generates_notifications(self):
        initial_count = Notification.objects.filter(recipient=self.student_user).count()

        assessment = Assessment.objects.create(
            class_section=self.class_section,
            name='Midterm Exam',
            assessment_type='MIDTERM',
            max_marks=100,
            weight=30
        )

        GradeRecord.objects.create(
            enrollment=self.enrollment,
            assessment=assessment,
            score=Decimal('95.00'),
            grade='A',
            feedback='Outstanding work!'
        )

        # Should create notification for student and parent
        student_notifs = Notification.objects.filter(recipient=self.student_user, notification_type='GRADE_POSTED')
        parent_notifs = Notification.objects.filter(recipient=self.parent_user, notification_type='GRADE_POSTED')

        self.assertGreater(student_notifs.count(), initial_count)
        self.assertGreater(parent_notifs.count(), 0)
        self.assertIn('Midterm Exam', student_notifs.first().title)

    def test_attendance_absent_signal_generates_alert(self):
        Attendance.objects.create(
            student=self.student,
            status='ABSENT',
            reason='Unexcused medical absence'
        )

        parent_notifs = Notification.objects.filter(recipient=self.parent_user, notification_type='ATTENDANCE_ALERT')
        self.assertGreater(parent_notifs.count(), 0)
        self.assertEqual(parent_notifs.first().priority, 'HIGH')

    def test_fee_notice_signal_generates_alert(self):
        fee_type = FeeType.objects.create(
            name='Science Lab Fee',
            category='miscellaneous',
            amount=Decimal('150.00'),
            academic_year='2025/2026'
        )

        StudentFee.objects.create(
            student=self.student,
            fee_type=fee_type,
            amount_due=Decimal('150.00'),
            amount_paid=Decimal('0.00'),
            due_date=date(2025, 10, 1),
            academic_year='2025/2026',
            status='pending'
        )

        parent_notifs = Notification.objects.filter(recipient=self.parent_user, notification_type='FEE_DUE')
        self.assertGreater(parent_notifs.count(), 0)
        self.assertIn('Science Lab Fee', parent_notifs.first().title)
