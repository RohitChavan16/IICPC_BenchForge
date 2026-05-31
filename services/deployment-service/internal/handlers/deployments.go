package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/deployer"
	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/repository"
)

type Handler struct {
	db                *sql.DB
	deployer          *deployer.Deployer
	portStart         int
	portEnd           int
	deploymentNetwork string
}

func NewHandler(db *sql.DB) *Handler {
	ps := 30000
	pe := 31000
	if v := os.Getenv("DEPLOY_PORT_START"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			ps = n
		}
	}
	if v := os.Getenv("DEPLOY_PORT_END"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			pe = n
		}
	}
	network := os.Getenv("DEPLOY_NETWORK")
	if network == "" {
		network = "iicpc_benchforge_default"
	}
	return &Handler{db: db, deployer: deployer.NewDeployer(db), portStart: ps, portEnd: pe, deploymentNetwork: network}
}

func (h *Handler) ListDeployments(w http.ResponseWriter, r *http.Request) {
	items, err := repository.ListDeployments(h.db, 100)
	if err != nil {
		log.Printf("list deployments error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

func (h *Handler) GetDeployment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	d, err := repository.GetDeploymentByID(h.db, id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		log.Printf("get deployment error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(d)
}

type createReq struct {
	SubmissionID  string `json:"submissionId"`
	ContainerPort int    `json:"containerPort,omitempty"`
}

func (h *Handler) CreateDeployment(w http.ResponseWriter, r *http.Request) {
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.SubmissionID == "" {
		http.Error(w, "submissionId required", http.StatusBadRequest)
		return
	}

	// validate submission exists and built
	var containerImage, status string
	err := h.db.QueryRow(`SELECT container_image, status FROM submissions WHERE id=$1`, req.SubmissionID).Scan(&containerImage, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "submission not found", http.StatusBadRequest)
			return
		}
		log.Printf("validate submission error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if status != "BUILT" || containerImage == "" {
		http.Error(w, "submission not built or missing image", http.StatusBadRequest)
		return
	}

	// choose containerPort
	cp := 8080
	if req.ContainerPort != 0 {
		cp = req.ContainerPort
	}

	dep, err := repository.CreateDeployment(h.db, req.SubmissionID, cp)
	if err != nil {
		log.Printf("create deployment db error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// allocate host port
	hostPort, err := h.deployer.AllocatePort(h.db, h.portStart, h.portEnd)
	if err != nil {
		// mark failed
		repository.UpdateDeployment(h.db, dep.ID, "", "", 0, "FAILED")
		http.Error(w, "no available host ports", http.StatusInternalServerError)
		return
	}

	// mark deploying and record allocated host port
	if err := repository.UpdateDeployment(h.db, dep.ID, "", "", hostPort, "DEPLOYING"); err != nil {
		log.Printf("update deploying error: %v", err)
	}
	// note allocated port in log
	_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("allocated host_port=%d, container_port=%d", hostPort, cp))

	// run docker
	name := fmt.Sprintf("deployment-%s", dep.ID)
	containerID, runOutput, err := h.deployer.RunContainer(containerImage, hostPort, cp, name, h.deploymentNetwork)
	if err != nil {
		log.Printf("run container error: %v", err)
		// persist run output and error
		_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("docker run error: %v\n\n%s", err, runOutput))
		repository.UpdateDeployment(h.db, dep.ID, "", "", hostPort, "FAILED")
		http.Error(w, "failed to start container", http.StatusInternalServerError)
		return
	}

	// persist run output and container id
	_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("docker run output:\n%s", runOutput))
	if err := repository.UpdateDeployment(h.db, dep.ID, containerID, containerImage, hostPort, "RUNNING"); err != nil {
		log.Printf("update running error: %v", err)
	}

	d, _ := repository.GetDeploymentByID(h.db, dep.ID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

func (h *Handler) StopDeployment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	d, err := repository.GetDeploymentByID(h.db, id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		log.Printf("get deployment error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if d.ContainerID == "" {
		http.Error(w, "no container to stop", http.StatusBadRequest)
		return
	}
	stopOutput, err := h.deployer.StopContainer(d.ContainerID)
	if err != nil {
		log.Printf("stop container error: %v", err)
		_ = repository.AppendDeploymentLog(h.db, id, fmt.Sprintf("docker stop/rm error: %v\n%s", err, stopOutput))
		repository.StopDeployment(h.db, id, "FAILED")
		http.Error(w, "failed to stop container", http.StatusInternalServerError)
		return
	}
	_ = repository.AppendDeploymentLog(h.db, id, fmt.Sprintf("docker stop/rm output:\n%s", stopOutput))
	repository.StopDeployment(h.db, id, "STOPPED")
	updated, _ := repository.GetDeploymentByID(h.db, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
