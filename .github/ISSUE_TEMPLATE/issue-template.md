---
name: Issue Template
about: Create a new Issue
title: ''
labels: ''
assignees: brendanosborne

---

**Describe the issue**
A clear and concise description of what the issue is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Tunnel Config**
Provide a screenshot of your tunnel config with tunnel name, private key, public key, preshared key and endpoint removed.

**Starting WireSock directly**
If possible, follow the instructions below and comment on the outcome:

1. Open TunnlTo and Enable the tunnel (this will save the config file to disk)
2. Disable the tunnel and close TunnlTo
3. Open a command prompt and issue the following commands (make sure you alter the username in the second command):
```
cd C:\Program Files\WireSock VPN Client\bin
wiresock-client.exe run -config C:\Users\<YOUR USERNAME>\AppData\Local\TunnlTo\tunnel.conf -log-level all
```
