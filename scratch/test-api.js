fetch("http://localhost:3000/api/public/register-tenant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test School End to End",
    city: "Mumbai",
    state: "MH",
    adminEmail: "testadmin_e2e@schoolpay.in",
    adminPassword: "password123",
    tenantType: "SCHOOL",
    schoolCode: "TESTE2E",
    plan: "FREE_DEMO",
    isDemo: true
  })
}).then(res => res.json().then(data => console.log({ status: res.status, data }))).catch(console.error);
