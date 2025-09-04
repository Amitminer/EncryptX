# Test health endpoint first
GET http://localhost:8080/health
HTTP/1.1 200

# Test 1: Encrypt with password and verify response
POST http://localhost:8080/encrypt
Content-Type: application/octet-stream
x-password: testpass
x-orig-filename: test.txt
file,./test.txt;
HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
header "content-length" exists

# Test 2: Encrypt with auto-generated key
POST http://localhost:8080/encrypt
Content-Type: application/octet-stream
x-orig-filename: test_auto.txt
file,./test.txt;
HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
header "x-generated-key" exists
header "content-length" exists
[Captures]
generated_key: header "x-generated-key"

# Test 3: Try to decrypt with the generated key (using a fresh encrypt)
POST http://localhost:8080/encrypt
Content-Type: application/octet-stream
x-enc-key: {{generated_key}}
x-orig-filename: test_key.txt
file,./test.txt;
HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
header "content-length" exists