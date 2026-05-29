package benchmarkclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
	retries    int
}

func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: timeout,
		},
		retries: 3,
	}
}

func (c *Client) CreateBenchmark(ctx context.Context, req CreateBenchmarkRequest) (*BenchmarkResponse, error) {
	if req.Name == "" {
		return nil, errors.New("name is required")
	}
	if req.WorkerCount < 0 {
		return nil, errors.New("workerCount must be >= 0")
	}
	var out BenchmarkResponse
	err := c.doWithRetry(ctx, http.MethodPost, c.baseURL+"/benchmarks", req, &out, http.StatusCreated)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) UpdateStatus(ctx context.Context, id string, req UpdateStatusRequest) (*BenchmarkResponse, error) {
	if id == "" {
		return nil, errors.New("benchmark id is required")
	}
	if req.Status == "" {
		return nil, errors.New("status is required")
	}
	var out BenchmarkResponse
	err := c.doWithRetry(ctx, http.MethodPatch, fmt.Sprintf("%s/benchmarks/%s/status", c.baseURL, id), req, &out, http.StatusOK)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) doWithRetry(ctx context.Context, method, url string, body interface{}, out interface{}, expectedStatus int) error {
	backoff := 200 * time.Millisecond
	for attempt := 1; attempt <= c.retries; attempt++ {
		err := c.doRequest(ctx, method, url, body, out, expectedStatus)
		if err == nil {
			return nil
		}
		if !isRetryable(err) || attempt == c.retries {
			return err
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
			backoff *= 2
		}
	}
	return errors.New("retry attempts exhausted")
}

func (c *Client) doRequest(ctx context.Context, method, url string, body interface{}, out interface{}, expectedStatus int) error {
	var payload io.Reader
	if body != nil {
		buf := new(bytes.Buffer)
		if err := json.NewEncoder(buf).Encode(body); err != nil {
			return err
		}
		payload = buf
	}

	req, err := http.NewRequestWithContext(ctx, method, url, payload)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != expectedStatus {
		raw, _ := io.ReadAll(resp.Body)
		statusErr := &httpStatusError{statusCode: resp.StatusCode, body: string(raw)}
		if resp.StatusCode >= 500 {
			return statusErr
		}
		return statusErr
	}

	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

type httpStatusError struct {
	statusCode int
	body       string
}

func (e *httpStatusError) Error() string {
	return fmt.Sprintf("unexpected status %d: %s", e.statusCode, e.body)
}

func isRetryable(err error) bool {
	if err == nil {
		return false
	}
	var statusErr *httpStatusError
	if errors.As(err, &statusErr) {
		return statusErr.statusCode >= 500
	}
	var netErr net.Error
	if errors.As(err, &netErr) {
		return netErr.Timeout() || netErr.Temporary()
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	if strings.Contains(strings.ToLower(err.Error()), "timeout") {
		return true
	}
	return false
}
