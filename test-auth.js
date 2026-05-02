async function testRole(email) {
  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: '123456' })
  });
  const loginJson = await loginRes.json();
  const userData = loginJson.data || loginJson;
  const token = userData.token;
  const role = userData.role;
  
  if (!token) {
    console.log(`❌ FAIL [${email}] — No token returned. Response:`, JSON.stringify(loginJson));
    return;
  }

  // 2. Test /curriculum/subjects (all roles)
  const subjectsRes = await fetch('http://localhost:5000/api/curriculum/subjects', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // 3. Test /quiz/analytics/class (teacher/admin only)
  let classRes = null;
  if (role === 'teacher' || role === 'admin') {
    classRes = await fetch('http://localhost:5000/api/quiz/analytics/class', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // 4. Test /quiz/analytics/student (student only)
  let studentRes = null;
  if (role === 'student') {
    studentRes = await fetch('http://localhost:5000/api/quiz/analytics/student', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  const subjectsOk = subjectsRes.status === 200;
  const roleApiOk = role === 'student' ? studentRes?.status === 200 : classRes?.status === 200;
  const status = subjectsOk && roleApiOk ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${email} | role: ${role} | /subjects: ${subjectsRes.status} | role-api: ${role === 'student' ? studentRes?.status : classRes?.status}`);
}

async function run() {
  console.log('\n=== FULL E2E ROLE TEST ===\n');
  await testRole('student@demo.com');
  await testRole('teacher@demo.com');
  await testRole('admin@demo.com');
  console.log('\n=== DONE ===\n');
}
run();
