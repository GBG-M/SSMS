import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

USERS = [
    {
        "role": "ADMIN",
        "email": "admin@ssms.edu",
        "password": "AdminPass123!",
        "portal_path": "/dashboard",
        "checks": [
            ("/api/accounts/users/", "User accounts directory"),
            ("/api/academics/class-sections/", "Academic class sections"),
            ("/api/finance/student-fees/", "Finance student fee structures"),
            ("/api/scheduling/class-schedules/", "Institution-wide schedules"),
            ("/api/notifications/", "Admin notifications center"),
            ("/api/communications/threads/", "Internal communications threads")
        ]
    },
    {
        "role": "TEACHER",
        "email": "teacher@ssms.edu",
        "password": "TeacherPass123!",
        "portal_path": "/teacher/dashboard",
        "checks": [
            ("/api/academics/class-sections/", "Faculty assigned class sections"),
            ("/api/scheduling/class-schedules/", "Faculty teaching timetable"),
            ("/api/academics/assessments/", "Curriculum assessments and quizzes"),
            ("/api/communications/contacts/", "Faculty communications contact directory"),
            ("/api/notifications/", "Teacher alerts and notices")
        ]
    },
    {
        "role": "STUDENT",
        "email": "student@ssms.edu",
        "password": "StudentPass123!",
        "portal_path": "/student/dashboard",
        "checks": [
            ("/api/students/students/", "Student personal enrollment record"),
            ("/api/students/attendance/", "Student attendance tracking"),
            ("/api/academics/grade-records/", "Academic grade records"),
            ("/api/scheduling/class-schedules/", "Class timetable schedule"),
            ("/api/communications/contacts/", "Direct teacher & staff inquiry directory"),
            ("/api/notifications/", "Student real-time notifications")
        ]
    },
    {
        "role": "PARENT",
        "email": "parent@ssms.edu",
        "password": "ParentPass123!",
        "portal_path": "/parent/dashboard",
        "checks": [
            ("/api/students/students/", "Linked enrolled children"),
            ("/api/students/attendance/", "Children attendance records"),
            ("/api/academics/grade-records/", "Children academic report records"),
            ("/api/finance/student-fees/", "Children tuition and fee dues"),
            ("/api/communications/contacts/", "Parent eligible teachers contact list"),
            ("/api/notifications/", "Parent-specific alerts and fee notices")
        ]
    }
]

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("=" * 70)
    print("STARTING E2E USER PERSONA VERIFICATION (Admin, Teacher, Student, Parent)")
    print("=" * 70)
    
    total_passed = 0
    total_failed = 0
    
    for u in USERS:
        role = u["role"]
        email = u["email"]
        password = u["password"]
        print(f"\n[PERSONA] Testing: {role} ({email})")
        
        # 1. Login
        status, res_data = make_request(
            f"{BASE_URL}/api/accounts/login/",
            method="POST",
            data={"email": email, "password": password}
        )
        
        if status != 200:
            print(f"  [FAIL] LOGIN FAILED (Status {status}): {res_data}")
            total_failed += 1
            continue
            
        token = res_data.get("token") or res_data.get("access")
        roles = res_data.get("role_names") or [r.get("name") for r in res_data.get("roles", [])] if isinstance(res_data.get("roles"), list) else res_data.get("roles")
        print(f"  [PASS] Login successful! Token acquired. Roles: {roles}")
        total_passed += 1
        
        auth_headers = {"Authorization": f"Token {token}"}
        
        # 2. Profile check
        prof_status, prof_data = make_request(f"{BASE_URL}/api/accounts/profile/", headers=auth_headers)
        if prof_status == 200:
            full_name = prof_data.get("full_name") or prof_data.get("email")
            role_names = prof_data.get("role_names", [])
            print(f"  [PASS] Profile OK: '{full_name}' | Roles: {role_names}")
            total_passed += 1
        else:
            print(f"  [FAIL] Profile failed: {prof_status} {prof_data}")
            total_failed += 1
            
        # 3. Check persona specific endpoints
        for endpoint, label in u["checks"]:
            st, data = make_request(f"{BASE_URL}{endpoint}", headers=auth_headers)
            if st in [200, 201]:
                count = len(data) if isinstance(data, list) else len(data.get("results", [])) if isinstance(data, dict) and "results" in data else 1
                print(f"  [PASS] {label} ({endpoint}): HTTP {st} ({count} record(s))")
                total_passed += 1
            else:
                error_snippet = str(data)[:100].replace("\n", " ")
                print(f"  [FAIL] {label} ({endpoint}) failed: HTTP {st} -> {error_snippet}")
                total_failed += 1

    print("\n" + "=" * 70)
    print(f"E2E TEST SUMMARY: {total_passed} PASSED, {total_failed} FAILED")
    print("=" * 70)
    if total_failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
