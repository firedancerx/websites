@echo off
cd /d "D:\Firedancerx\OneDrive\Work2026\Kojid\Kojidapp\kojid.my"
"C:\php\8.5\php.exe" artisan schedule:run >> "D:\Firedancerx\OneDrive\Work2026\Kojid\Kojidapp\kojid.my\storage\logs\scheduler.log" 2>&1
