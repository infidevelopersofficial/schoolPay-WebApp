$modules = @("students", "teachers", "parents", "attendance", "exams", "lessons", "messages", "announcements", "reports", "admin")

foreach ($mod in $modules) {
    $uiFiles = (Get-ChildItem -Path "app\(dashboard)\$mod" -Recurse -File -Filter "*.tsx" -ErrorAction SilentlyContinue | Measure-Object).Count
    $dalExists = Test-Path "lib\dal\$mod.ts"
    $actionExists = Test-Path "app\(dashboard)\$mod\actions.ts"
    Write-Host "Module: $mod | UI Files: $uiFiles | DAL Exists: $dalExists | Action Exists: $actionExists"
}
