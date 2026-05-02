import { spawn } from 'node:child_process'
import process from 'node:process'

const children = []
let shuttingDown = false

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  })

  children.push({ name, child })

  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${name} exited with ${signal ?? code}`)
      shutdown(1)
    }
  })

  return child
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const { child } of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  setTimeout(() => {
    for (const { child } of children) {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }
    process.exit(exitCode)
  }, 700)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

run('backend', 'npm', ['start'], { cwd: 'backend' })
run('frontend', 'npm', ['run', 'dev', '--', '--host', '0.0.0.0'])
