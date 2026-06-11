package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
)

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	
	err := rdb.XGroupCreateMkStream(context.Background(), "telemetry_stream", "telemetry_group", "$").Err()
	if err != nil {
		fmt.Println("telemetry_stream:", err)
	} else {
		fmt.Println("telemetry_stream created")
	}

	err = rdb.XGroupCreateMkStream(context.Background(), "submission_stream", "submission_group", "$").Err()
	if err != nil {
		fmt.Println("submission_stream:", err)
	} else {
        fmt.Println("submission_stream created")
    }

    err = rdb.XGroupCreateMkStream(context.Background(), "pipeline_stream", "pipeline_group", "$").Err()
	if err != nil {
		fmt.Println("pipeline_stream:", err)
	} else {
        fmt.Println("pipeline_stream created")
    }
}
