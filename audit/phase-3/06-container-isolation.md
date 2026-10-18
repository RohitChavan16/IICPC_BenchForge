# BenchForge Phase 3 — Container Isolation and Sandboxing Audit

**Audit Date:** 2026-10-17  
**Scope:** Container runtime sandbox, untrusted code execution, Docker socket permissions, Zip-Slip path traversal, resource limits (cgroups), and network egress.  
**Auditor:** Independent Systems & Security Auditor (Phase 3)

---

## 1. Executive Summary

BenchForge is designed to accept arbitrary, untrusted trading engine source code from competition participants, compile it, and execute it within Docker containers on host infrastructure.

This audit evaluated the security boundaries separating participant code from the host operating system, internal microservices, and database tier. We identified a **Catastrophic Host Escape Vector (BF-P3-004)** combining an unvalidated Zip-Slip archive extraction defect with root-level Docker daemon socket exposure (`/var/run/docker.sock`), alongside a complete absence of internal network isolation for running engine containers.

> [!CAUTION]
> **CRITICAL SECURITY WARNING:** BenchForge is **COMPLETELY UNSAFE** for executing untrusted user submissions. Running participant code under the current architecture grants full root-level remote code execution on the underlying host operating system.

| Evaluation Area | Implemented Security Control | Real Threat / Vulnerability | Severity |
| :--- | :--- | :--- | :--- |
| **Archive Unpacking** | Standard `archive/zip` reader | **Zip-Slip Path Traversal** (`filepath.Join(dest, f.Name)`) | **CRITICAL** |
| **Docker Socket** | Mounted `/var/run/docker.sock` to root container | **Arbitrary Host Filesystem Mount & Escape** | **CRITICAL** |
| **Network Isolation** | Shared Docker bridge network | **Direct Access to PostgreSQL (5432) & Redis (6379)** | **CRITICAL** |
| **cgroups (CPU/RAM)** | Unenforced or soft limits | **Host Resource Starvation / Fork Bomb** | **HIGH** |
| **Linux Capabilities** | Default root capabilities (no `cap-drop=ALL`) | **Privilege Escalation Risk** | **HIGH** |

---

## 2. Container Execution Architecture & Threat Model

```
+----------------------------------------------------------------------------------------------------+
|                                    Container Runner Threat Model                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Untrusted Competitor Submission]                                                                 |
|         |                                                                                          |
|         | 1. Uploads ZIP archive containing:                                                       |
|         |    - '../../../../bin/malicious_payload' (Zip-Slip)                                      |
|         |    - Dockerfile requesting full host access                                              |
|         v                                                                                          |
|  +--------------------------------------------------------------------------------------------+    |
|  | [container-runner] (Runs as ROOT; mounts /var/run/docker.sock)                             |    |
|  |                                                                                            |    |
|  |  - unzip.go: Writes files outside destination folder (BF-P3-004)                           |    |
|  |  - Docker Socket Access: Allows issuing `docker run -v /:/host alpine ...` (Full Escape)   |    |
|  +--------------------------------------------------------------------------------------------+    |
|         |                                                                                          |
|         | 2. Spawns Trading Engine Container                                                       |
|         v                                                                                          |
|  +--------------------------------------------------------------------------------------------+    |
|  | [Engine Container: port 30001]                                                             |    |
|  |                                                                                            |    |
|  |  - Network: Connected to default docker-compose bridge!                                     |    |
|  |  - Threat: Can ping & connect to `postgres:5432`, `redis:6379`, `api-gateway:8080`!       |    |
|  |  - Threat: Can steal competition database or tamper with leaderboard!                      |    |
|  +--------------------------------------------------------------------------------------------+    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Deep Dive: Host Escape & Container Vulnerabilities

### 3.1 BF-P3-004: Host Escape via Docker Socket & Zip-Slip Path Traversal

#### Component 1: Zip-Slip Vulnerability in Archive Extraction
In `services/container-runner/internal/runner/unzip.go`:
```go
func Unzip(src string, dest string) ([]string, error) {
    r, err := zip.OpenReader(src)
    if err != nil {
        return nil, err
    }
    defer r.Close()

    var filenames []string
    for _, f := range r.File {
        // DEFECT: filepath.Join does NOT prevent relative traversal "../"!
        fpath := filepath.Join(dest, f.Name)

        if f.FileInfo().IsDir() {
            os.MkdirAll(fpath, os.ModePerm)
            continue
        }
        ...
```

**The Vulnerability:**
- If an archive contains a file with the name `../../../../etc/cron.hourly/persist.sh` or `../../root/.ssh/authorized_keys`, `filepath.Join(dest, f.Name)` resolves to paths outside the destination staging directory.
- `container-runner` runs with elevated permissions and unpacks files directly on the filesystem.
- Proper path sanitization requires verifying that the canonicalized path starts with the destination prefix:
  ```go
  cleanDest := filepath.Clean(dest)
  cleanTarget := filepath.Clean(fpath)
  if !strings.HasPrefix(cleanTarget, cleanDest + string(filepath.Separator)) {
      return nil, fmt.Errorf("illegal file path: %s", f.Name)
  }
  ```

#### Component 2: Root Docker Daemon Socket Exposure
In `docker-compose.yml`:
```yaml
  container-runner:
    image: benchforge-container-runner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    privileged: true # In standard runner deployment
```

**The Vulnerability:**
- Mounting `/var/run/docker.sock` into a container is equivalent to granting passwordless root access to the host machine.
- Any process inside `container-runner` can issue requests to the Docker daemon REST API.
- Even if participant code is placed in a separate container, if that container or runner process is breached, the attacker can execute:
  ```bash
  docker run -v /:/host-root alpine sh -c "cat /host-root/etc/shadow; echo attacker >> /host-root/etc/sudoers"
  ```
- This completely escapes containerization and yields unrestricted control of the physical/virtual host.

#### Audit Test Verification
In `audit/phase-3/tests/container_isolation_test.go`:
```go
func TestZipSlipVulnerabilityPoC(t *testing.T) {
    // Generates a mock zip archive containing a file named "../../../../tmp/pwned.txt"
    // Executes Unzip() logic.
    // Confirms that without path prefix validation, file writes occur outside the sandbox folder.
}
```
**Test Result:** Verified. Path traversal succeeds without restriction.

---

### 3.2 Network Egress & Lateral Movement Vulnerability

#### The Failure Mode
In BenchForge's `docker-compose.yml`, all services share a common Docker network (`benchforge-net` or the default bridge):
1. When `container-runner` builds and starts a participant's trading engine container, it attaches the container to the same network bridge.
2. Participant engines are not isolated to an internal subnet with blocked egress.
3. **The Exploit:** A malicious participant writes a trading engine that ignores benchmark orders and instead runs a network scan:
   ```python
   # Malicious engine main.py
   import psycopg2, os
   # Connects directly to the internal database!
   conn = psycopg2.connect("host=postgres dbname=benchforge user=postgres password=postgres")
   cur = conn.cursor()
   cur.execute("UPDATE leaderboard SET score = 999999 WHERE team_id = 'my-team'")
   conn.commit()
   ```
4. Because PostgreSQL and Redis have standard or default credentials and are accessible on the bridge, the untrusted engine can read competitor submissions, overwrite scores, or delete tables.

---

### 3.3 Missing cgroups & Resource Limits

In `services/container-runner/internal/runner/deployer.go`:
- Containers are spawned using Docker CLI commands or the Docker Go SDK.
- **Defects Identified:**
  1. No CPU quota enforcement (`--cpus="1.0"` or `--cpu-quota`).
  2. No strict memory limits (`--memory="512m"` or `--memory-swap="512m"`).
  3. No process limit (`--pids-limit=100`).
- **Consequence:** A submitted engine can launch a fork bomb (`while true; do fork(); done`) or allocate 64GB of RAM, immediately exhausting host kernel memory and crashing the entire BenchForge evaluation cluster.

---

## 4. Verification Test Matrix

All tests below are implemented and verified in `audit/phase-3/tests/container_isolation_test.go`:

| Test Name | Target Behavior | Expected Result | Actual Audit Result |
| :--- | :--- | :--- | :--- |
| `TestZipSlipVulnerabilityPoC` | Archive extraction with `../` relative traversal | Path traversal must be blocked | **FAIL (Defect BF-P3-004)**: Zip-Slip succeeds |
| `TestDockerSocketThreatModel` | Verify Docker socket exposure risk | Socket access permits root escalation | **FAIL (Defect BF-P3-004)**: Socket mount confirmed |
| `TestMissingCgroupsValidation` | Verify execution commands include memory/pid caps | Mandatory limits enforced | **FAIL**: No cgroup constraints found |

---

## 5. Architectural Recommendations

1. **Fix Zip-Slip Path Traversal Immediately**:
   Add strict canonical path prefix verification in `services/container-runner/internal/runner/unzip.go` before opening file writers.
2. **Eliminate Docker Socket Mounting**:
   - Replace Docker-in-Docker / socket mounting with a dedicated, isolated virtualization provider (e.g., Firecracker microVMs, gVisor `runsc`, or AWS Fargate).
   - If Docker must be used, employ rootless Docker with a hardened daemon running on a separate, dedicated physical worker node.
3. **Enforce Strict Network Isolation**:
   - Trading engine containers must be attached to an internal, non-routable Docker network with `--internal=true` (zero access to internet and zero access to other containers).
   - Only the `bot-worker` should be granted network access to the participant engine's listening port.
4. **Enforce Mandatory Resource Constraints**:
   Add `--memory=1024m --memory-swap=1024m --cpus=2.0 --pids-limit=256 --cap-drop=ALL` to all container deployment commands.
