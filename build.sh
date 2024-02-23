export PATH=/opt/node-v16.13.1-linux-x64/bin:$PATH
vue-tsc --version
tnpm install && tnpm run build && mv dist/* bin
