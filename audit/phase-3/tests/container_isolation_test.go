package main

import (
	"archive/zip"
	"bytes"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Replicate vulnerable unzip from container-runner runner.go:246-278
func vulnerableUnzip(zipReader *zip.Reader, dest string) ([]string, error) {
	extractedPaths := make([]string, 0)
	for _, f := range zipReader.File {
		// VULNERABILITY (BF-P1-002): No check that fpath starts with dest
		fpath := filepath.Join(dest, f.Name)
		extractedPaths = append(extractedPaths, fpath)
	}
	return extractedPaths, nil
}

// Secure unzip with Zip-Slip path traversal protection
func secureUnzip(zipReader *zip.Reader, dest string) ([]string, error) {
	cleanDest := filepath.Clean(dest) + string(os.PathSeparator)
	extractedPaths := make([]string, 0)

	for _, f := range zipReader.File {
		fpath := filepath.Join(dest, f.Name)
		if !strings.HasPrefix(fpath, cleanDest) {
			return nil, os.ErrPermission // Traversal detected!
		}
		extractedPaths = append(extractedPaths, fpath)
	}
	return extractedPaths, nil
}

func TestContainer_ZipPathTraversalProofOfConcept(t *testing.T) {
	// Create an in-memory zip archive with a malicious relative path entry
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	maliciousPath := "../../../../etc/cron.d/malicious_job"
	fileWriter, err := zipWriter.Create(maliciousPath)
	if err != nil {
		t.Fatalf("Failed to create zip entry: %v", err)
	}
	io.WriteString(fileWriter, "* * * * * root /tmp/pwn.sh\n")
	zipWriter.Close()

	// Read back zip
	zipReader, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatalf("Failed to open zip: %v", err)
	}

	targetDir := filepath.Join(os.TempDir(), "benchforge-sandbox")

	// 1. Evaluate Vulnerable Unzip (Production container-runner implementation)
	extractedPaths, err := vulnerableUnzip(zipReader, targetDir)
	if err != nil {
		t.Fatalf("Unexpected error in vulnerable unzip: %v", err)
	}

	traversalEscaped := false
	for _, p := range extractedPaths {
		if !strings.HasPrefix(p, targetDir) {
			traversalEscaped = true
			t.Logf("CONFIRMED ZIP-SLIP VULNERABILITY (BF-P1-002): Target destination '%s' escaped to: '%s'",
				targetDir, p)
		}
	}

	if !traversalEscaped {
		t.Fatalf("Expected vulnerable unzip to allow path escape!")
	}

	// 2. Evaluate Secure Unzip (Remediation verification)
	_, errSecure := secureUnzip(zipReader, targetDir)
	if errSecure == nil {
		t.Fatalf("Secure unzip failed to block directory traversal!")
	}
	t.Logf("Verified Remediation: Secure unzip successfully detected and blocked traversal entry.")
}

func TestContainer_DockerSocketMountThreatModel(t *testing.T) {
	t.Log("Auditing Container Deployment Threat Model (BF-P1-004, BF-P1-005, BF-P1-024):")
	t.Log("1. docker-compose.yml lines 102 & 117: /var/run/docker.sock mounted in container-runner and deployment-service.")
	t.Log("2. Container runner runs as root (WORKDIR /root/ in Dockerfile).")
	t.Log("3. Combined with Zip-Slip (BF-P1-002), an attacker can overwrite binaries or communicate with the Docker daemon.")
	t.Log("4. Access to /var/run/docker.sock allows an attacker to spawn privileged containers with host root filesystem mounts, achieving full host takeover.")
	t.Log("5. Contestant containers are placed on 'iicpc_benchforge_default', allowing direct TCP connections to PostgreSQL (5432) and Redis (6379).")
	t.Log("6. Docker run lacks --memory, --cpus, and --pids-limit, allowing unconstrained resource exhaustion by submitted code.")
}
