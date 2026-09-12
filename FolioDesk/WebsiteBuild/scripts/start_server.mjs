import { spawn } from 'child_process';

const child = spawn('npx.cmd', ['next', 'dev', '-p', '3000'], {
  cwd: 'D:\\Websites\\FolioDesk\\WebsiteBuild',
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});
