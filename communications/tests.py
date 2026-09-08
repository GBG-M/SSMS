import uuid
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from students.models import Student
from academics.models import AcademicYear, Subject, ClassSection, Enrollment
from notifications.models import Notification
from .models import ConversationThread, ThreadMessage, SchoolAnnouncement


class CommunicationsTests(APITestCase):

    def setUp(self):
        # 1. Setup Roles
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.role_teacher, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.role_parent, _ = Role.objects.get_or_create(name=Role.PARENT)
        self.role_student, _ = Role.objects.get_or_create(name=Role.STUDENT)

        # 2. Users
        self.admin = User.objects.create_user(
            email='admin@ssms.test',
            username='admin_user',
            password='Password123!',
            first_name='Admin',
            last_name='Principal'
        )
        self.admin.roles.add(self.role_admin)

        self.teacher_math = User.objects.create_user(
            email='math.teacher@ssms.test',
            username='math_teacher',
            password='Password123!',
            first_name='John',
            last_name='Calculus'
        )
        self.teacher_math.roles.add(self.role_teacher)

        self.teacher_art = User.objects.create_user(
            email='art.teacher@ssms.test',
            username='art_teacher',
            password='Password123!',
            first_name='Leonardo',
            last_name='DaVinci'
        )
        self.teacher_art.roles.add(self.role_teacher)

        self.parent_user = User.objects.create_user(
            email='parent@ssms.test',
            username='parent_user',
            password='Password123!',
            first_name='Martha',
            last_name='Wayne'
        )
        self.parent_user.roles.add(self.role_parent)

        self.other_parent = User.objects.create_user(
            email='other.parent@ssms.test',
            username='other_parent',
            password='Password123!',
            first_name='Arthur',
            last_name='Curry'
        )
        self.other_parent.roles.add(self.role_parent)

        # 3. Student
        self.student = Student.objects.create(
            student_id='STU-COMM-01',
            first_name='Bruce',
            last_name='Wayne',
            date_of_birth=date(2010, 2, 19),
            gender='MALE',
            email='bruce.wayne@ssms.test',
            phone_number='1112223333',
            address='Wayne Manor',
            emergency_contact_name='Alfred Pennyworth',
            emergency_contact_phone='9998887777',
            current_grade='9',
            current_class='Grade 9A',
            academic_year='2025/2026',
            guardian_name='Martha Wayne',
            guardian_relationship='Mother',
            guardian_phone='1112223333',
            status='ACTIVE'
        )

        # Link Martha to Bruce
        self.parent_profile = ParentProfile.objects.create(
            user=self.parent_user,
            phone_number='1112223333',
            relationship='Mother'
        )
        self.parent_profile.students.add(self.student)

        # 4. Academics: Math teacher teaches Bruce, Art teacher DOES NOT
        self.acad_year = AcademicYear.objects.create(
            name='2025/2026',
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            is_active=True
        )
        self.subject_math = Subject.objects.create(code='MATH101', name='Algebra 1')
        self.subject_art = Subject.objects.create(code='ART101', name='Fine Art')

        self.section_math = ClassSection.objects.create(
            section_code='SEC-MATH-01',
            name='Math Section 1',
            academic_year=self.acad_year,
            subject=self.subject_math,
            teacher=self.teacher_math,
            is_active=True
        )
        self.section_art = ClassSection.objects.create(
            section_code='SEC-ART-01',
            name='Art Section 1',
            academic_year=self.acad_year,
            subject=self.subject_art,
            teacher=self.teacher_art,
            is_active=True
        )

        Enrollment.objects.create(
            student=self.student,
            class_section=self.section_math,
            status='ACTIVE'
        )

    def test_parent_create_thread_with_assigned_teacher(self):
        """Parent successfully creates an inquiry thread with their child's math teacher."""
        self.client.force_authenticate(user=self.parent_user)
        payload = {
            'student_id': self.student.id,
            'recipient_id': self.teacher_math.id,
            'subject': 'Inquiry about homework',
            'category': 'ACADEMIC',
            'initial_message': 'Hello Mr. Calculus, could you explain the homework deadline?'
        }
        url = reverse('communications:thread-list')
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['subject'], 'Inquiry about homework')
        self.assertEqual(len(response.data['messages']), 1)

        # Verify decoupled push alert was created in notifications
        notif = Notification.objects.filter(recipient=self.teacher_math).first()
        self.assertIsNotNone(notif)
        self.assertIn('Inquiry about homework', notif.title)

    def test_parent_cannot_message_unrelated_teacher(self):
        """Parent cannot create an inquiry with an art teacher who does not teach their child."""
        self.client.force_authenticate(user=self.parent_user)
        payload = {
            'student_id': self.student.id,
            'recipient_id': self.teacher_art.id,
            'subject': 'Random Question',
            'category': 'GENERAL',
            'initial_message': 'Do you have art supplies?'
        }
        url = reverse('communications:thread-list')
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('recipient_id', response.data)

    def test_teacher_replies_to_thread(self):
        """Teacher can post a response to an active thread."""
        thread = ConversationThread.objects.create(
            student=self.student,
            subject='Exam Prep',
            category='ACADEMIC',
            status='OPEN',
            created_by=self.parent_user
        )
        thread.participants.add(self.parent_user, self.teacher_math)
        ThreadMessage.objects.create(
            thread=thread,
            sender=self.parent_user,
            content='When is the midterm?'
        )

        # Teacher replies
        self.client.force_authenticate(user=self.teacher_math)
        url = reverse('communications:thread-post-message', kwargs={'pk': thread.id})
        response = self.client.post(url, {'content': 'The midterm is next Thursday at 10 AM.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(thread.messages.count(), 2)

        # Verify notification dispatched to parent
        notif = Notification.objects.filter(recipient=self.parent_user).first()
        self.assertIsNotNone(notif)
        self.assertIn('Exam Prep', notif.title)

    def test_unrelated_user_cannot_access_thread(self):
        """A user who is not a participant cannot retrieve or see thread contents."""
        thread = ConversationThread.objects.create(
            student=self.student,
            subject='Confidential Discussion',
            category='BEHAVIOR',
            status='OPEN',
            created_by=self.parent_user
        )
        thread.participants.add(self.parent_user, self.teacher_math)

        # Other parent tries to view
        self.client.force_authenticate(user=self.other_parent)
        url = reverse('communications:thread-detail', kwargs={'pk': thread.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resolve_thread(self):
        """Participant can resolve an inquiry thread."""
        thread = ConversationThread.objects.create(
            student=self.student,
            subject='Bus schedule question',
            category='GENERAL',
            status='OPEN',
            created_by=self.parent_user
        )
        thread.participants.add(self.parent_user, self.teacher_math)

        self.client.force_authenticate(user=self.teacher_math)
        url = reverse('communications:thread-resolve', kwargs={'pk': thread.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RESOLVED')

    def test_contacts_directory_scoping(self):
        """Parent contacts directory includes their child and the child's teacher and school staff."""
        self.client.force_authenticate(user=self.parent_user)
        url = reverse('communications:contacts_directory')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        children = response.data.get('children', [])
        self.assertEqual(len(children), 1)
        recipients = children[0]['eligible_recipients']
        recipient_ids = [r['id'] for r in recipients]
        self.assertIn(self.teacher_math.id, recipient_ids)
        self.assertNotIn(self.teacher_art.id, recipient_ids)  # Art teacher not eligible!

    def test_school_announcement_lifecycle(self):
        """Admin creates announcement; parent can read it."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('communications:announcement-list')
        payload = {
            'title': 'School Closed for Winter Break',
            'content': 'Classes resume on January 5th.',
            'target_audience': 'ALL',
            'priority': 'IMPORTANT'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Parent reads announcements
        self.client.force_authenticate(user=self.parent_user)
        res_parent = self.client.get(url)
        self.assertEqual(res_parent.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_parent.data.get('results', res_parent.data)), 1)
