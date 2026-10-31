// Vercel CLI's spawned env can contain both PATH and Path on Windows.
// Normalize only local build subprocesses; never weaken the app runtime.
const cp = require('node:child_process');
const original = cp.spawn;
const path = require('node:path');
cp.spawn = function(command, args, options) {
  if (process.platform === 'win32') {
    if (options?.env) {
      const env = {...options.env};
      const paths = [env.PATH,env.Path,process.env.PATH,process.env.Path].filter(Boolean);
      delete env.Path;
      env.PATH = [path.join(options.cwd||process.cwd(),'node_modules','.bin'),...paths].join(';');
      options = {...options,env};
    }
    if (command.toLowerCase() === 'cmd.exe') command = process.env.ComSpec;
  }
  return original.call(this,command,args,options);
};
