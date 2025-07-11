# Generate encryption key for key-based tests
GET http://localhost:8080/generate-key
HTTP/1.1 200
[Captures]
key_b64: jsonpath "$.key"

# Encrypt with password
POST http://localhost:8080/encrypt
Content-Type: application/octet-stream
x-password: testpass
x-orig-filename: test.txt
body == file,./test.txt;
HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
[Captures]
encrypted_body_password: body

# Decrypt with password
POST http://localhost:8080/decrypt
Content-Type: application/octet-stream
x-password: testpass
{{encrypted_body_password}}

HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
body == file,./test.txt

# Encrypt with key
POST http://localhost:8080/encrypt
Content-Type: application/octet-stream
x-enc-key: {{key_b64}}
x-orig-filename: test2.txt
file,./test2.txt;

HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
[Captures]
encrypted_body_key: body

# Decrypt with key
POST http://localhost:8080/decrypt
Content-Type: application/octet-stream
x-enc-key: {{key_b64}}
{{encrypted_body_key}}

HTTP/1.1 200
[Asserts]
header "content-type" == "application/octet-stream"
body == file,./test2.txt
