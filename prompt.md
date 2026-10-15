# Project Prompt History

This file documents the chronological sequence of prompts provided during the development of the **SG BusLive** application.

---

### Prompt 1: Initial Application Build
**Timestamp:** 2026-10-14 23:39:16 (UTC-7)

```text
build a singapore based bus arrival time application that track real time  bus location and provides accurate wait time prediction for all LTA bus stops

build just the front end for now, i will include the backend connection later.
```

---

### Prompt 2: First Git Repository Push
**Timestamp:** 2026-10-14 23:49:32 (UTC-7)

```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@https://github.com/weimin955/Vibe-starter-2026-Oct.git
```

---

### Prompt 3: Second Git Repository Push
**Timestamp:** 2026-10-14 23:53:11 (UTC-7)

```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@https://github.com/weimin955/LTA-bus-arrival.git
```

---

### Prompt 4: Serverless LTA DataMall v3 Integration
**Timestamp:** 2026-10-15 00:06:20 (UTC-7)

```text
add a serverless connection that pulls live data from LTA Datamall using the following endpoints:

- store this in /apit folder (project root level) not the src folder
- include /health.ts and /busarrival.ts within that sub folder
- do not hardcode any key, i will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

---

### Prompt 5: Prompt Aggregation
**Timestamp:** 2026-10-15 00:55:44 (UTC-7)

```text
gather all the prompts that i have written thus far and store it on prompt.mdfile
```
