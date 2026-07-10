package main
import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	re := regexp.MustCompile(`(?m)^(\s*)http\.Error\(([^,]+),\s*(.+?),\s*([^\)]+)\)`)
	
	err := filepath.Walk(`e:\AIML_Projects\iicpc_benchforge\services`, func(path string, info fs.FileInfo, err error) error {
		if err != nil { return err }
		if !strings.HasSuffix(path, `.go`) { return nil }
		
		content, err := os.ReadFile(path)
		if err != nil { return err }
		
		if !bytes.Contains(content, []byte(`http.Error`)) { return nil }

		newContent := re.ReplaceAllStringFunc(string(content), func(match string) string {
			submatch := re.FindStringSubmatch(match)
			if len(submatch) != 5 { return match }
			indent := submatch[1]
			w := submatch[2]
			msg := submatch[3]
			code := submatch[4]
			return fmt.Sprintf(`%s%s.Header().Set("Content-Type", "application/json")
%s%s.WriteHeader(%s)
%sjson.NewEncoder(%s).Encode(map[string]interface{}{"error": %s, "status": %s})`, indent, w, indent, w, code, indent, w, msg, code)
		})
		
		// If changed, ensure encoding/json is imported.
		if string(content) != newContent {
			if !strings.Contains(newContent, `"encoding/json"`) {
				// add encoding/json import
				// Very naive, just insert it after package ... or import ( ... )
				if strings.Contains(newContent, "import (") {
					newContent = strings.Replace(newContent, "import (", "import (\n\t\"encoding/json\"\n", 1)
				} else {
					newContent = strings.Replace(newContent, "package ", "import \"encoding/json\"\n\npackage ", 1)
				}
			}
			os.WriteFile(path, []byte(newContent), 0644)
			fmt.Printf("Updated %s\n", path)
		}
		
		return nil
	})
	if err != nil {
		fmt.Println(err)
	}
}
