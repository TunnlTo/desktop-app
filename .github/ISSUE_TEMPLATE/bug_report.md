---
name: Bug report
about: Create a report to help us improve
title: 'ISSUE: '
labels: bug
assignees: ''
---

**If you disregard this template, your issue may risk being overlooked and closed. Kindly invest some time in furnishing as much information as possible. This enables us to promptly diagnose your issue without necessitating multiple follow-up inquiries. Your cooperation is greatly appreciated.**

If any of the following questions are irrelevant, indicate them as "Not Applicable."

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

**Tested on official WireGuard client**
Are you experiencing the same issue using the official Windows WireGuard client?

**Tested on different VPN servers**
Are you experiencing the issue on multiple VPN servers?

**Screenshots and GIF's**
If applicable, add screenshots to help explain your problem. GIF's are even better.

**Tunnel Config**
Provide a screenshot of your tunnel config with tunnel name, private key, public key, pre-shared key and endpoint removed.

**Logs**
In Settings, change the "WireSock Log Level" to "Show All Logs". Copy/paste the logs here with any identifying information removed.

**Starting WireSock directly**
If possible, follow the instructions below and comment on the outcome:

1. Open TunnlTo and Enable the tunnel (this will save the config file to disk)
2. Disable the tunnel and close TunnlTo
3. Open a command prompt and issue the following commands:
```
cd "C:\Program Files\WireSock VPN Client\bin"

// Ensure you alter the <YOUR USERNAME> component of the path
wiresock-client.exe run -config C:\Users\<YOUR USERNAME>\AppData\Local\TunnlTo\tunnel.conf -log-level all
```
