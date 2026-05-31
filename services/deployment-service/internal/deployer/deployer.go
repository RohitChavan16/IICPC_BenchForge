package deployer

import (
	"database/sql"
	"fmt"
	"log"
	"os/exec"
	"strings"
)

type Deployer struct {
	db *sql.DB
}

func NewDeployer(db *sql.DB) *Deployer { return &Deployer{db: db} }

func (d *Deployer) RunContainer(image string, hostPort, containerPort int, name, network string) (string, string, error) {
	args := []string{"run", "-d", "-p", fmt.Sprintf("%d:%d", hostPort, containerPort), "--name", name}
	if network != "" {
		args = append(args, "--network", network)
	}
	args = append(args, image)
	cmd := exec.Command("docker", args...)
	out, err := cmd.CombinedOutput()
	outStr := strings.TrimSpace(string(out))
	if err != nil {
		log.Printf("docker run error: %v output: %s", err, outStr)
		return "", outStr, fmt.Errorf("docker run failed: %v: %s", err, outStr)
	}
	// docker returns container id on success
	id := strings.TrimSpace(outStr)
	// shorten id if it's long
	if len(id) > 64 {
		id = id[:64]
	}
	return id, outStr, nil
}

func (d *Deployer) StopContainer(containerID string) (string, error) {
	if containerID == "" {
		return "", nil
	}
	var combinedOut strings.Builder
	cmd := exec.Command("docker", "stop", containerID)
	out, err := cmd.CombinedOutput()
	combinedOut.WriteString(string(out))
	if err != nil {
		log.Printf("docker stop error: %v out:%s", err, string(out))
		return combinedOut.String(), err
	}
	// remove
	cmd = exec.Command("docker", "rm", containerID)
	out, err = cmd.CombinedOutput()
	combinedOut.WriteString("\n")
	combinedOut.WriteString(string(out))
	if err != nil {
		log.Printf("docker rm error: %v out:%s", err, string(out))
		return combinedOut.String(), err
	}
	return combinedOut.String(), nil
}

func (d *Deployer) AllocatePort(db *sql.DB, start, end int) (int, error) {
	for p := start; p <= end; p++ {
		inUse, err := isPortUsed(db, p)
		if err != nil {
			return 0, err
		}
		if !inUse {
			return p, nil
		}
	}
	return 0, fmt.Errorf("no free ports in range %d-%d", start, end)
}

func isPortUsed(db *sql.DB, port int) (bool, error) {
	var exists bool
	if err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM deployments WHERE host_port=$1 AND deployment_status IN ('DEPLOYING','RUNNING'))`, port).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}
